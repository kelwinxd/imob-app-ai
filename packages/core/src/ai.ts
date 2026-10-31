import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import type { z } from "zod";
import {
  ClassificationSchema, ROOMS, STRUCTURE_ELEMENTS, VisionCheckSchema,
  type Classification, type Quality, type VisionCheck,
} from "@imob/shared";
import { toJpeg } from "./imaging";

export interface AiConfig {
  apiKey: string;
  imageModel: string;
  visionModel: string;
  mock: boolean;
}

export interface GenerationResult {
  images: Buffer[];
  usage: unknown;
}

export interface Ai {
  readonly imageModel: string;
  readonly visionModel: string;
  classify(img: Buffer): Promise<Classification>;
  generate(input: Buffer, prompt: string, size: string, n: number, quality: Quality): Promise<GenerationResult>;
  checkStructure(before: Buffer, after: Buffer): Promise<VisionCheck>;
}

const classificationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["comodo", "confianca", "ocupado", "pessoas", "documentos_ou_telas", "objetos_pessoais", "observacao"],
  properties: {
    comodo: { type: "string", enum: [...ROOMS] },
    confianca: { type: "number", description: "0 a 1" },
    ocupado: { type: "boolean", description: "true se já há móveis no cômodo" },
    pessoas: { type: "boolean" },
    documentos_ou_telas: { type: "boolean", description: "documentos, papéis legíveis ou telas ligadas" },
    objetos_pessoais: { type: "boolean", description: "fotos de família, nomes, objetos que identificam moradores" },
    observacao: { type: "string", description: "uma frase curta, em português" },
  },
};

const elementJson = {
  type: "object",
  additionalProperties: false,
  required: ["mudou", "detalhe"],
  properties: { mudou: { type: "boolean" }, detalhe: { type: "string", description: "vazio se não mudou" } },
};

const visionCheckJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [...STRUCTURE_ELEMENTS, "itens_adicionados", "veredito"],
  properties: {
    ...Object.fromEntries(STRUCTURE_ELEMENTS.map((k) => [k, elementJson])),
    itens_adicionados: {
      type: "array",
      items: { type: "string" },
      description: "móveis e objetos adicionados, em português, no singular, minúsculos, do maior para o menor",
    },
    veredito: { type: "string", enum: ["aprovado", "revisar", "reprovado"] },
  },
};

const CLASSIFY_INSTRUCTIONS =
  "Esta é uma foto de anúncio imobiliário. Identifique o cômodo e sinalize problemas de privacidade (LGPD) e se o cômodo já está mobiliado.";

const CHECK_INSTRUCTIONS = `A imagem 1 é a FOTO ORIGINAL de um imóvel. A imagem 2 é uma VERSÃO DECORADA virtualmente por IA.
Compare somente os elementos fixos do imóvel: paredes, janelas, portas, piso, teto, perspectiva/enquadramento e luz natural.
Móveis, tapetes, plantas, quadros e objetos soltos adicionados são esperados e NÃO contam como alteração. Um móvel na frente que apenas esconde parte de um elemento também não é alteração.
Conta como alteração: elemento fixo adicionado, removido, movido, redimensionado, ou com forma, material ou cor diferente; mudança de ângulo ou de enquadramento; vista da janela diferente.
Veredito: "reprovado" se houver qualquer alteração estrutural clara; "revisar" se houver dúvida ou diferença pequena (ex.: tom de parede levemente diferente); "aprovado" caso contrário.
Liste também todos os itens adicionados, do maior para o menor (móveis primeiro, objetos pequenos por último).`;

export function createAi(config: AiConfig): Ai {
  return config.mock ? createMockAi() : createOpenAiAi(config);
}

function createOpenAiAi(config: AiConfig): Ai {
  if (!config.apiKey) throw new Error("OPENAI_API_KEY ausente. Preencha a chave no .env ou ative AI_MOCK.");
  const client = new OpenAI({ apiKey: config.apiKey, maxRetries: 3, timeout: 5 * 60 * 1000 });

  async function structured<T>(name: string, schema: Record<string, unknown>, parser: z.ZodType<T>, text: string, images: Buffer[]): Promise<T> {
    const content = [
      { type: "input_text" as const, text },
      ...(await Promise.all(
        images.map(async (img) => ({
          type: "input_image" as const,
          detail: "high" as const,
          image_url: `data:image/jpeg;base64,${(await toJpeg(img, 1280, 85)).toString("base64")}`,
        })),
      )),
    ];
    const res = await client.responses.create({
      model: config.visionModel,
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name, schema, strict: true } },
    });
    return parser.parse(JSON.parse(res.output_text));
  }

  return {
    imageModel: config.imageModel,
    visionModel: config.visionModel,
    classify: (img) => structured("classificacao_comodo", classificationJsonSchema, ClassificationSchema, CLASSIFY_INSTRUCTIONS, [img]),
    checkStructure: (before, after) => structured("trava_estrutura", visionCheckJsonSchema, VisionCheckSchema, CHECK_INSTRUCTIONS, [before, after]),
    async generate(input, prompt, size, n, quality) {
      const res = await client.images.edit({
        model: config.imageModel,
        image: await toFile(input, "comodo.png", { type: "image/png" }),
        prompt,
        n,
        size,
        quality,
        output_format: "png",
      });
      const images = (res.data ?? []).map((d) => {
        if (!d.b64_json) throw new Error("Resposta da OpenAI sem imagem (b64_json vazio).");
        return Buffer.from(d.b64_json, "base64");
      });
      if (images.length === 0) throw new Error("A OpenAI não retornou nenhuma imagem.");
      return { images, usage: res.usage ?? null };
    },
  };
}

// Simulação: variações 1 e 2 só ganham um "sofá" na parte de baixo; a 3 é espelhada,
// para exercitar a camada de bordas da trava sem gastar créditos.
function createMockAi(): Ai {
  const ok = { mudou: false, detalhe: "" };
  return {
    imageModel: "simulado",
    visionModel: "simulado",
    async classify() {
      return { comodo: "sala", confianca: 0.5, ocupado: false, pessoas: false, documentos_ou_telas: false, objetos_pessoais: false, observacao: "classificação simulada" };
    },
    async checkStructure() {
      return {
        paredes: ok, janelas: ok, portas: ok, piso: ok, teto: ok, perspectiva: ok, luz_natural: ok,
        itens_adicionados: ["sofá", "tapete", "planta"],
        veredito: "aprovado",
      };
    },
    async generate(input, _prompt, _size, n) {
      await new Promise((r) => setTimeout(r, 1500));
      const { width = 1024, height = 1024 } = await sharp(input).metadata();
      const sofa = (hue: string) =>
        Buffer.from(
          `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
            `<rect x="${width * 0.2}" y="${height * 0.68}" width="${width * 0.6}" height="${height * 0.2}" rx="${width * 0.02}" fill="${hue}"/>` +
            `<rect x="${width * 0.3}" y="${height * 0.9}" width="${width * 0.4}" height="${height * 0.06}" fill="#c9b79c"/></svg>`,
        );
      const colors = ["#6b5b4b", "#8a8f99", "#556b2f"];
      const images = await Promise.all(
        Array.from({ length: n }, (_, i) => {
          let img = sharp(input);
          if (i === 2) img = img.flop();
          return img.composite([{ input: sofa(colors[i % colors.length]) }]).png().toBuffer();
        }),
      );
      return { images, usage: { simulado: true } };
    },
  };
}
