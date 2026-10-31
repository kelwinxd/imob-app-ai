# Staging com recibo

Staging virtual com comprovação: fotos decoradas por IA com selo, página pública antes/depois com QR e dossiê em PDF. Veja o [plano técnico](PLANO-TECNICO.md).

## App (web + API)

Requisitos: Node 20+, Docker.

```bash
npm install
cp .env.example .env      # preencha OPENAI_API_KEY
npm run db:up             # Postgres em localhost:5440
npm run dev:mock          # API + web sem gastar créditos (IA simulada)
npm run dev               # API + web com a OpenAI de verdade
```

Abra http://localhost:5300. A API roda em http://localhost:4600 e aplica as migrações sozinha ao subir.

### Estrutura

```
apps/
  api/          Express + Drizzle (Postgres) + pg-boss (fila)
    src/features/<feature>/   rotas, serviço e jobs de cada feature
    src/shared/               storage, fila, erros HTTP, IA
    drizzle/                  migrações SQL (gerar com npm run db:generate)
  web/          Vite + React + Tailwind + React Query + axios
    src/features/<feature>/
      api/          chamadas axios tipadas
      hooks/        lógica (queries, mutações, regras de tela)
      components/   componentes de apresentação, só props
      containers/   ligam hooks a componentes
      pages/        telas das rotas
    src/shared/ui/  componentes visuais reutilizáveis
packages/
  shared/       tipos, enums e schemas zod usados pela API e pelo front
  core/         geração, trava, selo, página pública e dossiê (usado pela API e pelo script)
    prompts/templates.json    instruções versionadas
scripts/concierge/  script da etapa 0
```

Fluxo do app: **Fotos** (upload e confirmação de cômodo) → **Estilo** → **Escolha** (3 variações por foto, com a trava) → **Publicar** (selo, formatos de portal, página `/i/:slug`, QR e dossiê).

Os arquivos ficam em `data/storage/` (fora do git). Os originais nunca são alterados.

## Script concierge (etapa 0)

Script que pega uma pasta de fotos e entrega o mesmo resultado sem o app. Serve como teste concierge com corretores reais.

### Preparar

```bash
npm install
cp .env.example .env   # preencha OPENAI_API_KEY
```

| Variável | Padrão | Uso |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Chave da OpenAI (use um projeto separado, com limite de gasto) |
| `IMAGE_MODEL` | `gpt-image-2` | Geração das variações |
| `VISION_MODEL` | `gpt-5.4-mini` | Cômodo, alertas de LGPD e trava de estrutura |
| `IMAGE_QUALITY` | `medium` | `low`, `medium` ou `high` |

### Fluxo

Coloque as fotos de um imóvel numa pasta (JPG, PNG ou WEBP; HEIC precisa ser convertido antes). As pastas `fotos/` e `out/` ficam fora do git.

**1. Classificar** — copia os originais sem alteração, calcula o SHA-256 e sugere o cômodo de cada foto.

```bash
npm run concierge -- classificar --entrada fotos/apto42 --saida out/apto42 --titulo "Apto 42 — Moema"
```

Revise `out/apto42/comodos.json`: corrija `confirmado` e marque `publicar: false` nas fotos que não devem ser decoradas. Fotos com pessoas, documentos ou móveis já vêm com `publicar: false`.

**2. Gerar** — 3 variações por foto, na mesma proporção da foto original, cada uma passando pela trava de estrutura.

```bash
npm run concierge -- gerar --saida out/apto42 --estilo escandinavo --padrao medio
```

Veja as variações em `out/apto42/geradas/` e escolha uma por foto em `out/apto42/escolhas.json` (número da variação, ou `null`). O arquivo já vem com a primeira variação não reprovada de cada foto.

Opções: `--qualidade high`, `--variacoes 2`, `--fotos p03,p05 --refazer` (gera de novo só essas), `--lado 2048` (lado maior em pixels), `--tamanho 1536x1024` (força um tamanho), `--paralelo 2`, `--limiar 0.55`.

**3. Publicar** — selo, formatos de portal, página antes/depois, QR code e dossiê.

```bash
npm run concierge -- publicar --saida out/apto42 --url https://seu-dominio.com.br/apto42
```

`--url` é o endereço onde você vai hospedar a pasta `site/` (Netlify Drop, Cloudflare Pages, GitHub Pages etc.). O selo e o QR apontam para ele, então publique a pasta nesse endereço exato.

**4. Verificar** — confere os hashes de todos os arquivos e a cadeia de eventos.

```bash
npm run concierge -- verificar --saida out/apto42
```

Para testar o fluxo sem gastar créditos, acrescente `--simulado` a qualquer comando.

### O que sai em `out/<imóvel>/`

| Caminho | Conteúdo |
| --- | --- |
| `originais/` | Bytes exatamente como recebidos (hash no dossiê) |
| `trabalho/` | Cópia orientada e sem EXIF, mais a entrada exata enviada ao modelo |
| `geradas/` | Todas as variações, sem selo |
| `final/` | Variação escolhida com selo, em resolução cheia |
| `portais/<portal>/` | Zap, Viva Real, OLX, Instagram feed e stories, com selo |
| `site/` | Página pública antes/depois (HTML estático, `noindex`) |
| `qrcode.png` | QR para a página pública |
| `dossie.pdf` | Dossiê do imóvel |
| `eventos.jsonl` | Registro de eventos encadeado por hash |
| `manifest.json` | Estado completo: prompts, modelos, uso de tokens e vereditos |

### Trava de estrutura

Cada variação recebe o pior veredito entre duas camadas:

- **Visão** (`VISION_MODEL`): compara original e gerada elemento por elemento (paredes, janelas, portas, piso, teto, perspectiva, luz natural) e lista os itens adicionados, que viram o texto do selo.
- **Bordas** (sem IA): correlação dos mapas de borda na faixa superior da foto. Abaixo de `--limiar`, a variação vai para "revisar".

Variações reprovadas não podem ser publicadas. As marcadas como "revisar" podem, e o dossiê registra que o operador confirmou.

O limiar 0,55 ainda **não foi calibrado**. Nos primeiros imóveis reais, anote quais variações estavam boas ou ruins e compare com a coluna `bordas` que o comando `gerar` imprime para achar o valor certo.

## Antes do piloto

- Conferir as dimensões exigidas por cada portal em `packages/shared/src/domain.ts` (`PORTALS`); os valores atuais são provisórios.
- Medir o custo real de um imóvel em `medium` e `high`: o comando `gerar` mostra os tokens acumulados, e o custo em dinheiro aparece no painel da OpenAI.
