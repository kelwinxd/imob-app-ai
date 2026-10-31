// Gera as imagens-símbolo de cada estilo para a tela de escolha de estilo (apps/web/public/styles).
// Uso: npx tsx scripts/style-examples.ts [estilo...]
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import OpenAI from "openai";
import { toJpeg } from "@imob/core";
import { STYLES, type Style } from "@imob/shared";
import { env, ROOT } from "./concierge/config";

const SCENES: Record<Style, string> = {
  moderno:
    "sala contemporânea marcante: sofá de linhas retas cinza-grafite, mesa de centro de vidro com base de metal preto, luminária de arco cromada, parede com painel ripado escuro e um único ponto de cor amarelo mostarda, luz quente de fim de tarde",
  escandinavo:
    "canto nórdico aconchegante (hygge): poltrona de madeira clara com manta de tricô grosso, pele de carneiro branca, parede branca, prateleira simples de madeira clara, plantas verdes e velas, luz natural difusa, tons branco, cinza claro e madeira clara",
  classico:
    "sala clássica elegante: sofá chesterfield capitonê de veludo, paredes com boiserie, lustre de cristal, cortinas pesadas com bandô, mesa lateral de madeira escura entalhada, quadros com moldura dourada, tons creme, dourado e madeira escura",
  industrial:
    "loft industrial: parede de tijolo aparente, eletrodutos e tubulação expostos, sofá de couro caramelo envelhecido, estante de ferro preto com madeira de demolição, pendentes com lâmpadas de filamento, piso de cimento queimado",
  minimalista:
    "ambiente minimalista quase vazio: parede branca lisa, um único banco baixo de madeira clara, um vaso de cerâmica com um galho seco, muito espaço livre, sombras suaves de luz natural, paleta branca e bege",
  praiano:
    "sala de casa de praia: poltronas de rattan e fibra natural, almofadas de linho azul e branco, conchas e corda náutica decorativas, cortina leve esvoaçante, janela com vista para o mar, luz de sol forte, tons de areia, branco e azul",
};

const PROMPT = (scene: string) =>
  `Fotografia de interiores profissional e realista, enquadramento de revista de decoração, que represente o estilo de forma icônica e inconfundível: ${scene}. Sem pessoas, sem texto, sem logotipos.`;

const only = process.argv.slice(2) as Style[];
const targets = only.length ? STYLES.filter((s) => only.includes(s)) : STYLES;
if (!env.apiKey) throw new Error("OPENAI_API_KEY ausente no .env");

const client = new OpenAI({ apiKey: env.apiKey, maxRetries: 3, timeout: 5 * 60 * 1000 });
const outDir = resolve(ROOT, "apps/web/public/styles");
await mkdir(outDir, { recursive: true });

await Promise.all(
  targets.map(async (style) => {
    const res = await client.images.generate({ model: env.imageModel, prompt: PROMPT(SCENES[style]), size: "1024x768", quality: "medium", n: 1 });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error(`Sem imagem para ${style}`);
    await writeFile(resolve(outDir, `${style}.jpg`), await toJpeg(Buffer.from(b64, "base64"), 640, 82));
    console.log(`ok ${style}`);
  }),
);
