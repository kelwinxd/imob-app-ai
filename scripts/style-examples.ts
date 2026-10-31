// Gera as miniaturas de exemplo de cada estilo (mesma sala, um estilo por imagem) para a tela de escolha de estilo.
// Uso: npx tsx scripts/style-examples.ts fotos/apto42/sala.png
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildPrompt, createAi, fitExactly, loadTemplates, makeWorkingCopy, matchingSize, toJpeg } from "@imob/core";
import { STYLES } from "@imob/shared";
import { env, ROOT } from "./concierge/config";

const source = process.argv[2];
if (!source) throw new Error("Informe a foto de um cômodo vazio: npx tsx scripts/style-examples.ts <foto>");

const outDir = resolve(ROOT, "apps/web/public/styles");
await mkdir(outDir, { recursive: true });

const ai = createAi({ ...env, mock: false });
const templates = await loadTemplates();
const work = await makeWorkingCopy(await readFile(resolve(source)));
const size = matchingSize(work.width, work.height, 1024);
const input = await fitExactly(work.buffer, size.width, size.height);

await Promise.all(
  STYLES.map(async (style) => {
    const prompt = buildPrompt(templates, "sala", style, "medio");
    const { images } = await ai.generate(input, prompt, `${size.width}x${size.height}`, 1, "medium");
    await writeFile(resolve(outDir, `${style}.jpg`), await toJpeg(images[0], 640, 80));
    console.log(`ok ${style}`);
  }),
);
