# Staging com recibo — planejamento do projeto

Oct 23, 2026 · @Kelwin

## Resumo

Staging virtual com IA para corretores e imobiliárias pequenas e médias, que já sai com comprovação: selo na foto, página pública de antes/depois com QR code e um dossiê guardado de cada anúncio.

- **Tese:** gerar imagem virou commodity. O valor está em fidelidade (a IA não pode mexer na estrutura do imóvel) e em transparência que o corretor consegue provar.
- **Mercado:** Brasil, B2B.
- **Estágio:** validação, antes de escrever código.
- **Nome:** provisório — "staging com recibo".

## Problema e mercado

Imóvel vazio vende pior, e o staging físico custa caro: de R$ 2.500 a R$ 6.000 por imóvel em São Paulo ([Lovart](https://www.lovart.ai/de/blog/case-study-real-estate-ai-interior-staging)). A Loft analisou 700 mil anúncios e viu que fotos de qualidade dão 26% mais cliques e 42% mais chance de visita ([Portas](https://portas.com.br/noticias/loft-aposta-em-ia-para-transformar-experiencia-imobiliaria-com-avatares-e-busca-inteligente/)).

O staging por IA já existe e está barato, então competir só em preço ou beleza não funciona:

| Concorrente | O que oferece | Observação |
| --- | --- | --- |
| [GenRoom](https://genroom.io/pt/virtual-staging-real-estate) | Staging em lote, 4K, marca d'água, formatos Zap/Viva Real/OLX | Menos de R$ 5 por imagem |
| [ZSky AI](https://zsky.ai/pt/ia-para-imobiliarias-fotos) | Staging, renders, fotos de imóvel | Plano grátis para corretores |
| [Ruum](https://www.cartacapital.com.br/?p=591825) | IA + arquitetos, foco em alto padrão | Serviço, não autoatendimento |
| [Loft](https://portas.com.br/noticias/quintoandar-leva-busca-de-imoveis-ao-chatgpt/) | Imagens e vídeos de anúncio com IA | Já dentro do sistema de muitas imobiliárias |

Gerador genérico de imagem é a categoria que mais morre: das 20 ferramentas que fecharam num levantamento de 258, 18 eram de imagem ([ToolDirectory](https://tooldirectory.ai/blog/state-of-ai-image-and-video-generation-2026)).

## Diferencial

A promessa não é "decore em 30 segundos", que todo concorrente já faz. É: **seu anúncio atrai menos visita frustrada, e você consegue provar que foi honesto.**

| Peça | O que é | Para que serve |
| --- | --- | --- |
| Selo descritivo | Marca na foto dizendo o que mudou ("móveis ilustrativos – IA"), não só "IA" | Transparência visível no próprio anúncio |
| Página antes/depois | Página web comum, com link e QR, mostrando original e gerada lado a lado | O comprador vê o imóvel real antes de agendar visita |
| Trava de estrutura | O sistema compara original e gerada e bloqueia se paredes, janelas, portas ou piso mudaram | Evita que o staging vire propaganda enganosa |
| Dossiê | Registro automático em PDF: originais com hash, geradas, datas, o que foi alterado, selo aplicado | Prova para o corretor se houver reclamação no Procon ou no CRECI |

O selo e a página não são feitos por IA: são um modelo fixo preenchido pelo sistema. Só as fotos decoradas são geradas.

O desenho segue a lei da Califórnia (AB 723, em vigor desde janeiro de 2026): aviso junto à imagem, link ou QR para a original, e distinção entre ajustes simples (luz, cor, recorte) e alterações ([PolicyRisk](https://policyrisk.com/state-bill/CA-AB723-20252026), [Inman](https://news.inman.com/2026/01/23/what-you-should-know-about-californias-new-listing-photo-law/)). No Brasil não há regra específica; o CDC já proíbe publicidade enganosa.

## Como funciona para o corretor

O corretor nunca escreve prompt: escolhe em menus e o sistema monta a instrução por trás.

1. Envia as fotos do imóvel (8 a 15, de uma vez).
2. Confirma o cômodo de cada foto — a IA sugere (sala, quarto, cozinha).
3. Escolhe o estilo (moderno, escandinavo, clássico, industrial, minimalista, praiano) e o padrão do imóvel (econômico, médio, alto).
4. Recebe 3 variações por foto e escolhe uma; pode pedir ajustes simples ("sem tapete", "sofá mais claro").
5. O sistema roda a trava de estrutura; se algo mudou, a variação é descartada ou marcada.
6. O sistema aplica o selo, cria a página antes/depois com QR e salva o dossiê.
7. O corretor baixa as fotos no tamanho de cada portal e publica com o link.

O padrão do imóvel limita o tipo de móvel: apartamento econômico não aparece com mobília de luxo, para não criar expectativa falsa.

Exemplo da instrução montada pelo sistema: *"Decore esta sala vazia em estilo escandinavo, padrão médio. Inclua sofá, mesa de centro, tapete e plantas. Não altere paredes, janelas, portas, piso nem iluminação natural. Mantenha a perspectiva."*

## Escopo do MVP

O MVP precisa provar que o corretor paga por staging com comprovação; tudo que não testa isso fica para depois.

**Dentro**

- Cadastro de imóvel e upload de fotos em lote
- Menus de cômodo, estilo e padrão; 3 variações por foto
- Selo aplicado automaticamente
- Página pública de antes/depois com QR code
- Dossiê em PDF por imóvel
- Trava de estrutura (versão simples)
- Download nos tamanhos de Zap, Viva Real, OLX e Instagram
- Cobrança por pacote (Pix e cartão)

**Depois**

- Ajustes finos por texto ("sem tapete") além das variações
- Remoção de móveis de imóvel ocupado
- Catálogo de móveis de lojas parceiras
- Vídeo curto do antes/depois para redes sociais
- Integração com CRMs imobiliários e portais
- Painel de equipe para imobiliárias com vários corretores

## Arquitetura e stack

Mesmo stack do projeto nutricional, para reaproveitar o que você já domina. Regra central: **o modelo gera, o sistema verifica e registra.**

| Camada | Escolha | Observação |
| --- | --- | --- |
| Front | Vite + React, mobile-first | Corretor usa muito pelo celular |
| API | Node + Express | Fila para gerações (geram em segundos, mas em lote) |
| Banco | Postgres | Imóveis, fotos, gerações, páginas, dossiês |
| Arquivos | Storage compatível com S3 (ex.: Cloudflare R2) | Originais nunca são alterados nem apagados |
| Geração | API de edição de imagem (Gemini/Nano Banana ou GPT Image) | Escolher pelo teste de fidelidade, não pela beleza |
| Trava de estrutura | Modelo de visão comparando original × gerada, com resposta estruturada | Começa simples; refinar com comparação de bordas depois |
| Selo e formatos | `sharp` | Compor o selo e redimensionar por portal |
| QR e PDF | `qrcode` + `pdfkit` | Dossiê com hash SHA-256 de cada original |
| Página pública | Rota `/i/:slug` com modelo fixo | Sem login, sem dados do proprietário |
| Cobrança | Mercado Pago ou Stripe | Pix é importante para corretor autônomo |

Instruções de cada estilo ficam versionadas no banco; cada geração registra qual versão usou, o que alimenta o dossiê.

## Modelo de negócio e preço

Assinatura mensal por número de imóveis, com preço acima dos geradores baratos porque vende proteção, não só imagem. Os valores abaixo são hipóteses para testar nas entrevistas.

| Plano | Para quem | Inclui | Preço a testar |
| --- | --- | --- | --- |
| Avulso | Corretor que quer experimentar | 1 imóvel completo | R$ 29–39 |
| Corretor | Autônomo | Até 5 imóveis/mês | R$ 79–99/mês |
| Imobiliária | Equipe pequena | Até 25 imóveis/mês, vários usuários | R$ 249–399/mês |

Custo aproximado: imagem por API sai entre US$ 0,006 e US$ 0,06 ([Powerdrill](https://powerdrill.ai/blog/the-competitive-landscape-of-the-global-ai-video-and-image-generation-market)). Um imóvel com 10 fotos × 3 variações = 30 gerações, algo como US$ 0,20 a US$ 1,80 — margem alta mesmo no plano avulso.

Referência de preço do concorrente direto: GenRoom cobra menos de R$ 50 por anúncio.

## Validação antes do código

Antes de programar, confirmar com 10 a 15 corretores e imobiliárias se a dor da transparência existe ou se eles só querem staging mais barato.

**Perguntas**

- Já teve cliente reclamando que o imóvel "não era como na foto"? O que aconteceu?
- Usa staging hoje? Qual ferramenta, quanto paga?
- Quantos imóveis vazios anuncia por mês?
- Pagaria mais por staging com página de antes/depois e comprovação? Quanto?

**Teste concierge**

- [ ] Gerar manualmente o staging de 3 a 5 imóveis reais com Nano Banana ou GPT Image
- [ ] Montar à mão a página de antes/depois e o PDF do dossiê
- [ ] Entregar e medir: publicaram? usaram o link? pediriam de novo?

**Critério para seguir**

- Pelo menos 3 pessoas contam histórias de reclamação sem você puxar o assunto
- Pelo menos 5 aceitam pagar um piloto
- Se todos responderem só "quero mais barato", o diferencial não se sustenta: voltar para a hipótese dos móveis planejados

## Plano por etapas

Seis etapas com dois portões: nenhum código antes de a validação passar, nenhuma expansão antes de haver clientes pagando e voltando.

&#91;embedded content: plano por etapas · 6 etapas, 2 portões\]

Sem datas fixas por enquanto: cada etapa termina quando o entregável funciona com imóveis reais. As etapas 1 a 3 podem usar o teste concierge como especificação.

## Riscos e regulação

O maior risco é a dor ser fraca: sem lei obrigando, corretor compra o que traz cliente, não o que traz conformidade.

| Risco | Mitigação |
| --- | --- |
| Sem obrigação legal, transparência vende pouco | Vender pela métrica de visita qualificada; validar antes de codar |
| Concorrentes copiam QR e antes/depois | Defesa pelo dossiê virar hábito e pela relação com imobiliárias |
| IA altera estrutura e o anúncio vira propaganda enganosa | Trava de estrutura + selo + original sempre disponível |
| Custo de API sobe ou modelo muda | Instruções versionadas; trocar de modelo sem mudar o produto |
| Fotos mostram pessoas, documentos ou objetos pessoais (LGPD) | Aviso no upload, página pública só com fotos escolhidas, regra de retenção |
| Foco dividido com o MVP nutricional | Decidir qual projeto é prioridade antes da etapa de código |

Referências regulatórias: CDC, art. 37 (publicidade enganosa); AB 723 da Califórnia como modelo; o COFECI só pode regular ética e técnica da profissão ([IRIB](https://www.irib.org.br/?p=157725)); em Portugal, mediadores já alertam para identificar imagens de IA ([RFM](https://rfm.pt/atualidade/amp/21673/o-mercado-imobiliario-esta-a-recorrer-a-ia-para-dar-nova-vida-a-casas-degradadas)).

*Não sou advogado — vale consulta antes de usar "proteção jurídica" como argumento de venda.*

## Referências

- [Lovart — staging por IA em São Paulo, custos](https://www.lovart.ai/de/blog/case-study-real-estate-ai-interior-staging)
- [Portas — Loft e dados de fotos de qualidade](https://portas.com.br/noticias/loft-aposta-em-ia-para-transformar-experiencia-imobiliaria-com-avatares-e-busca-inteligente/)
- [GenRoom — staging para corretores](https://genroom.io/pt/virtual-staging-real-estate)
- [ZSky AI — IA para imobiliárias](https://zsky.ai/pt/ia-para-imobiliarias-fotos)
- [CartaCapital — Ruum e home staging virtual](https://www.cartacapital.com.br/?p=591825)
- [ToolDirectory — estado da geração de imagem em 2026](https://tooldirectory.ai/blog/state-of-ai-image-and-video-generation-2026)
- [Powerdrill — preços de geração de imagem](https://powerdrill.ai/blog/the-competitive-landscape-of-the-global-ai-video-and-image-generation-market)
- [PolicyRisk — texto resumido da AB 723](https://policyrisk.com/state-bill/CA-AB723-20252026)
- [Inman — o que muda com a AB 723](https://news.inman.com/2026/01/23/what-you-should-know-about-californias-new-listing-photo-law/)
- [IRIB — limites normativos do COFECI](https://www.irib.org.br/?p=157725)
- [RFM — IA em anúncios imobiliários em Portugal](https://rfm.pt/atualidade/amp/21673/o-mercado-imobiliario-esta-a-recorrer-a-ia-para-dar-nova-vida-a-casas-degradadas)
