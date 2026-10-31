# Staging com recibo — plano técnico

23/10/2026 · base: `Staging com recibo — planejamento do projeto.md`

Regra central, herdada do planejamento: **o modelo gera, o sistema verifica e registra.** A IA só produz as fotos decoradas (e sugestões de cômodo). Selo, página, QR, dossiê, trava e cobrança são código determinístico.

---

## 1. Decisões principais

| Tema | Decisão | Por quê |
| --- | --- | --- |
| Geração de imagem | OpenAI **`gpt-image-2`** via `images.edit` | Fidelidade de entrada já é alta por padrão (não aceita `input_fidelity`, retorna 400 se enviado) |
| Visão (cômodo, LGPD, trava) | OpenAI **`gpt-5.4-mini`** via Responses API com saída JSON estruturada (`json_schema`) | Barato, aceita imagem, resposta tipada |
| Nomes de modelo | Em variável de ambiente + gravados em cada geração | Trocar de modelo sem mudar o produto (risco do planejamento) |
| Monorepo | `apps/web` (Vite + React + TS), `apps/api` (Express + TS), `packages/shared` (schemas zod) | Mesmo stack do planejamento; tipos compartilhados entre front e API |
| Fila | **pg-boss** (fila em cima do Postgres) | Sem Redis; uma infra a menos no MVP |
| ORM | Drizzle + migrations SQL | Leve, SQL explícito, convive bem com pg-boss no mesmo banco |
| Arquivos | Cloudflare R2 (S3), upload direto do navegador por URL pré-assinada | Fotos não passam pela API; originais em bucket separado com bloqueio de exclusão |
| Imagem | `sharp` | Normalização, selo, formatos de portal, mapas de borda da trava |
| PDF / QR | `pdfkit` + `qrcode` | Conforme planejamento |
| Página pública | HTML renderizado no servidor (Express + template), não SPA | Abre rápido no celular de quem escaneia o QR; sem JS pesado |
| Cobrança | Mercado Pago (Pix + cartão), pagamento único por pacote → créditos | MVP é "cobrança por pacote"; assinatura recorrente fica para depois |
| Auth | E-mail + senha (argon2), sessão em cookie httpOnly | Simples; login por link mágico pode vir depois |

> Antes de codar: os nomes e parâmetros dos modelos mudam rápido. Conferir na [referência de `images.edit`](https://developers.openai.com/api/reference/python/resources/images/methods/edit) e na [página do gpt-5.4-mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini) no dia do spike.

---

## 2. Arquitetura

```
 celular do corretor                         comprador (QR / link)
        │                                            │
   apps/web (Vite/React)                      GET /i/:slug  (HTML do servidor)
        │  REST + cookie                             │
        ▼                                            ▼
   apps/api (Express) ─────────── Postgres ◄──── leitura das fotos publicadas
        │   │ enfileira jobs         ▲
        │   └──────► pg-boss ────────┤
        │                            │
        │                     worker (mesmo código, processo separado)
        │                       ├─ OpenAI gpt-5.4-mini (cômodo, LGPD, trava)
        │                       ├─ OpenAI gpt-image-2 (geração)
        │                       └─ sharp / pdfkit / qrcode
        ▼                            │
   R2: presigned PUT/GET ◄───────────┘
   buckets: originals (imutável) · generated · public · dossiers
```

- A API nunca espera a OpenAI: só cria jobs e responde. O front acompanha o status por polling (a cada 2–3 s) ou SSE.
- O worker roda com concorrência limitada (ex.: 4 gerações simultâneas por conta, 8 no total) para não estourar o rate limit da OpenAI.
- A chave da OpenAI fica **só** no servidor (`.env`), num projeto OpenAI separado, com limite de gasto mensal configurado no painel.

---

## 3. Fluxo e jobs

| # | Etapa do corretor | Job / ação | Saída |
| --- | --- | --- | --- |
| 1 | Cria imóvel e envia 8–15 fotos | `POST /photos/presign` → PUT direto no R2 → `POST /photos/:id/uploaded` | Linha em `photos` |
| 2 | — | `photo.ingest`: SHA-256 dos **bytes originais**, guarda EXIF bruto, gera cópia de trabalho (auto-orient, sem GPS, ≤ 2048 px) | `sha256`, `working_key` |
| 3 | Confirma o cômodo | `photo.classify` (gpt-5.4-mini): cômodo sugerido + flags de pessoas, documentos, fotos pessoais, imóvel ocupado | `room_suggested`, `privacy_flags` |
| 4 | Escolhe estilo e padrão | `photo.generate`: monta o prompt da versão ativa e chama `images.edit` com `n=3` | 3 linhas em `generations` |
| 5 | — | `generation.check` para cada variação (trava, seção 5) | `verdict`: aprovado / revisar / reprovado |
| 6 | Escolhe 1 variação | `generation.finalize`: selo + formatos de portal | arquivos em `public/` |
| 7 | Publica o imóvel | `property.publish`: slug, QR, página, dossiê PDF | `public_pages`, `dossiers` |

Variações reprovadas não aparecem para escolha; as marcadas como "revisar" aparecem com aviso e o corretor precisa confirmar (fica registrado no dossiê).

---

## 4. Geração com OpenAI

**Chamada** (Node, SDK oficial `openai`):

```ts
const res = await openai.images.edit({
  model: env.IMAGE_MODEL,            // "gpt-image-2"
  image: await toFile(workingCopy, "room.png"),
  prompt,                            // montado a partir do template versionado
  n: 3,
  size: pickSize(width, height),     // 1536x1024 | 1024x1536 | 1024x1024
  quality: env.IMAGE_QUALITY,        // "medium" no spike; comparar com "high"
});
```

**Prompt montado pelo sistema** (template versionado em `prompt_templates`):

- Base fixa: restrições de estrutura ("não altere paredes, janelas, portas, piso, teto, tomadas, iluminação natural; mantenha perspectiva e enquadramento").
- Bloco do cômodo: lista de móveis permitidos por cômodo.
- Bloco do estilo: paleta e materiais.
- Bloco do padrão: limita o tipo de móvel (econômico não recebe mobília de luxo).
- Cada geração grava `template_id`, `template_version`, o prompt final completo, `model`, `quality`, `size` e o `created` da resposta da OpenAI.

**Pontos a medir no spike (etapa 0):**

1. **Proporção.** Resolvido: o `gpt-image-2` aceita resolução arbitrária (lados múltiplos de 16, proporção entre 1:3 e 3:1), então o script gera na mesma proporção da foto (4:3 vira 1536x1152). Confirmar no spike que a API aceita na prática.
2. **Resolução final.** 1536 px no lado maior provavelmente basta para os portais; validar com as exigências de cada portal antes de pensar em upscale.
3. **Custo real.** O planejamento estima US$ 0,006–0,06 por imagem, mas o `gpt-image-2` cobra por token e a qualidade alta deve sair acima disso. Medir o custo de 1 imóvel (10 fotos × 3 variações) em `medium` e `high` e refazer a conta de margem do plano avulso.
4. **Máscara.** Há relatos de erro 400 com máscara no `gpt-image-2`. O MVP não depende de máscara: só prompt + trava.

---

## 5. Trava de estrutura (versão simples)

Duas camadas independentes. O veredito final é a pior das duas.

**Camada A — visão (gpt-5.4-mini, saída estruturada)**

Recebe original + gerada e responde neste schema:

```json
{
  "paredes":    { "mudou": false, "detalhe": "" },
  "janelas":    { "mudou": false, "detalhe": "" },
  "portas":     { "mudou": false, "detalhe": "" },
  "piso":       { "mudou": false, "detalhe": "" },
  "teto":       { "mudou": false, "detalhe": "" },
  "perspectiva":{ "mudou": false, "detalhe": "" },
  "luz_natural":{ "mudou": false, "detalhe": "" },
  "itens_adicionados": ["sofá", "tapete"],
  "veredito": "aprovado | revisar | reprovado"
}
```

`itens_adicionados` alimenta o texto do selo ("sofá, tapete e plantas ilustrativos — IA").

**Camada B — determinística (`sharp`)**

- Reduz as duas imagens para 512 px em tons de cinza e gera mapas de borda (Sobel por convolução).
- Compara só a **faixa superior** (teto, topo de paredes e janelas), onde móveis quase nunca entram, com SSIM ou diferença média.
- Abaixo do limiar → "revisar". Limiar calibrado no spike com pares bons e ruins rotulados à mão.

Tudo vai para `structure_checks` (resposta JSON completa, métricas, versão da trava) e entra no dossiê.

---

## 6. Selo, formatos, página e dossiê

**Selo** — SVG gerado em código e composto com `sharp` no canto inferior. Texto descritivo + link curto:
`Móveis ilustrativos (IA): sofá, mesa, tapete · ver original: dominio.com/i/ab12cd`

**Formatos de portal** — tabela de configuração (`portal_formats`: nome, largura, altura, modo de ajuste, qualidade JPEG). Começar com Zap, Viva Real, OLX, Instagram feed (1080×1350) e stories (1080×1920). Conferir as especificações atuais de cada portal antes de fixar os números. Download em ZIP por portal.

**Página pública `/i/:slug`**
- Slug aleatório de 10 caracteres (não sequencial, não adivinhável).
- Para cada foto publicada: original e gerada lado a lado (ou slider), o selo e o que foi adicionado.
- Sem endereço exato, sem dados do proprietário, `noindex` por padrão.
- Só fotos que o corretor marcou para publicar.

**Dossiê PDF (por imóvel)**
- Capa: imóvel, corretor, CRECI (opcional), datas.
- Por foto: miniatura original + SHA-256, miniatura gerada + SHA-256, modelo e versão do prompt, veredito da trava com detalhes, texto do selo, data e hora (UTC e Brasília).
- Rodapé: link e QR da página pública.
- O próprio PDF tem SHA-256 registrado.

**Registro à prova de edição (barato e útil)** — tabela `audit_events` só de inserção, em que cada evento guarda o hash do evento anterior (cadeia de hashes). Qualquer alteração retroativa quebra a cadeia. O hash do último evento vai impresso no dossiê.

---

## 7. Modelo de dados (Postgres)

```
accounts         id, name, plan, credits_balance, created_at
users            id, account_id, email, password_hash, role, created_at
properties       id, account_id, title, standard (economico|medio|alto), style, status, created_at
photos           id, property_id, original_key, working_key, sha256, width, height,
                 exif_json, room_suggested, room_confirmed, privacy_flags, created_at
prompt_templates id, room, style, standard, version, body, active, created_at
generations      id, photo_id, template_id, template_version, prompt_text, model, quality,
                 size, output_key, sha256, status, cost_usd, chosen, created_at
structure_checks id, generation_id, checker_version, vision_json, edge_score, verdict, created_at
finals           id, generation_id, stamped_key, seal_text, created_at
portal_exports   id, final_id, portal, key
public_pages     id, property_id, slug, published_at, unpublished_at
dossiers         id, property_id, pdf_key, sha256, created_at
credit_ledger    id, account_id, delta, reason, payment_id, generation_id, created_at
payments         id, account_id, provider, provider_id, amount_cents, status, raw_json, created_at
audit_events     id, account_id, entity, entity_id, action, payload, prev_hash, hash, created_at
```

- Saldo de créditos sempre derivado de `credit_ledger` (o `credits_balance` é só cache).
- 1 crédito = 1 imóvel completo (até 15 fotos). Débito no `property.publish` ou na primeira geração, a decidir.

---

## 8. API (rotas do MVP)

```
POST   /auth/register | /auth/login | /auth/logout
GET    /me

POST   /properties                      GET /properties   GET /properties/:id
POST   /properties/:id/photos/presign   (lote de URLs pré-assinadas)
POST   /photos/:id/uploaded
PATCH  /photos/:id                      (room_confirmed, publicar sim/não)
POST   /properties/:id/generate         (estilo + padrão → enfileira todas as fotos)
GET    /properties/:id/status           (polling do progresso)
POST   /generations/:id/choose
POST   /properties/:id/publish          (selo, formatos, página, dossiê)
GET    /properties/:id/exports/:portal.zip
GET    /properties/:id/dossier.pdf

POST   /billing/checkout                (pacote → Mercado Pago)
POST   /billing/webhook                 (assinatura verificada, idempotente)

GET    /i/:slug                         (página pública, HTML)
```

Todo endpoint valida entrada com zod (schemas em `packages/shared`) e filtra por `account_id` da sessão.

---

## 9. Front (mobile-first)

Telas: login → lista de imóveis → novo imóvel (upload em lote com câmera/galeria) → confirmar cômodos (grade com chips) → estilo + padrão → progresso → escolher variação por foto (swipe entre as 3, avisos da trava) → publicar → downloads por portal + link/QR para copiar e mandar no WhatsApp.

Bibliotecas: React Router, TanStack Query (polling de status), Tailwind. Upload com compressão leve só para a pré-visualização; o arquivo original sobe intacto (o hash precisa bater com o que o corretor enviou).

---

## 10. Segurança, LGPD e custo

- Chave OpenAI só no servidor; limite de gasto no painel da OpenAI; cota diária de gerações por conta no app.
- Aviso no upload sobre pessoas, documentos e objetos pessoais; flags do `photo.classify` exibidas antes de gerar.
- GPS do EXIF nunca vai para cópia de trabalho, página ou portais (fica só no original privado).
- Retenção: originais e dossiês por N anos (definir com advogado); despublicar a página não apaga o dossiê.
- Rate limit nas rotas de auth e na página pública.
- Jobs idempotentes (chave por `photo_id + template_version + tentativa`), novas tentativas com backoff, e erro da OpenAI não consome crédito.

---

## 11. Deploy

- **API + worker + Postgres:** Railway ou Render (dois serviços do mesmo repositório: `npm run start:api` e `npm run start:worker`).
- **Front:** Cloudflare Pages ou Vercel.
- **Arquivos:** R2 com 4 buckets; `originals` com regra de bloqueio contra exclusão.
- **Domínio:** um domínio curto para os links do selo (`/i/:slug`).
- **Observabilidade:** logs estruturados (pino) + custo por geração gravado no banco para acompanhar a margem.

---

## 12. Etapas técnicas

Respeita os portões do planejamento: nada de produto antes de a validação passar.

| Etapa | Entregável | Portão |
| --- | --- | --- |
| **0. Spike / concierge** | Script CLI (`scripts/concierge.ts`): pasta de fotos → classifica → gera 3 variações → trava → selo → página HTML estática → dossiê PDF. Serve ao mesmo tempo como teste concierge e como teste de fidelidade e custo do `gpt-image-2` | Usar com 3–5 imóveis reais |
| — | **Portão 1:** critério de validação do planejamento (≥ 3 histórias espontâneas, ≥ 5 aceitam piloto) | |
| **1. Núcleo** | Monorepo, auth, imóveis, upload pré-assinado, `photo.ingest` com hash | |
| **2. Geração** | Templates versionados, `photo.classify`, `photo.generate`, escolha de variação | |
| **3. Comprovação** | Trava A+B, selo, formatos de portal, página `/i/:slug`, dossiê PDF, `audit_events` | Etapas 1–3 = funções do script da etapa 0 viradas jobs |
| **4. Cobrança** | Mercado Pago (Pix + cartão), créditos, webhook | |
| **5. Piloto** | Deploy, 5 pilotos pagantes, métricas (publicaram? usaram o link? voltaram?) | |
| — | **Portão 2:** clientes pagando e voltando → só então itens do "Depois" | |

A etapa 0 é o melhor investimento: as funções `classify`, `generate`, `checkStructure`, `stamp`, `buildPage` e `buildDossier` escritas no script viram, sem reescrita, os handlers dos jobs nas etapas 2 e 3.

---

## 13. Estrutura de pastas

```
imob-app/
  apps/
    api/      src/{routes,jobs,services/{openai,storage,seal,dossier,structure},db}
    web/      src/{pages,components,api}
  packages/
    shared/   schemas zod, enums (cômodo, estilo, padrão, portal)
  scripts/
    concierge.ts
  prompts/    templates iniciais (seed de prompt_templates)
  .env.example  OPENAI_API_KEY, IMAGE_MODEL, VISION_MODEL, IMAGE_QUALITY,
                DATABASE_URL, R2_*, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, PUBLIC_BASE_URL
```

---

## 14. Riscos técnicos específicos

| Risco | Mitigação |
| --- | --- |
| `gpt-image-2` muda o enquadramento ou "corrige" a perspectiva | Camada B da trava + teste de padding × recorte no spike |
| Trava com muitos falsos positivos (reprova coisa boa) | Começar como aviso ("revisar"), não bloqueio, até calibrar com dados reais |
| Custo por imóvel acima do estimado | Medir no spike; variações em `medium`; limitar a 3 variações e 15 fotos |
| Rate limit da OpenAI em lote | Concorrência controlada no pg-boss + novas tentativas com backoff |
| Pasta dentro do repositório git que cobre `Documents/` inteira | Rodar `git init` em `imob-app/` antes do primeiro código |
