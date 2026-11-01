import sharp from "sharp";
import type { FurnitureColorId, Quality, Room, Standard, Style, VariationCheck, Verdict } from "@imob/shared";
import type { Ai } from "./ai";
import { fitExactly, matchingSize, sha256, structureEdgeScore } from "./imaging";
import { buildPrompt, type Templates } from "./prompt";

export const CHECKER_VERSION = "trava-v2";
export const DEFAULT_EDGE_THRESHOLD = 0.55;
export const DEFAULT_LONG_EDGE = 1536;

const RANK: Record<Verdict, number> = { aprovado: 0, revisar: 1, reprovado: 2 };
export const worstVerdict = (a: Verdict, b: Verdict): Verdict => (RANK[a] >= RANK[b] ? a : b);

export async function checkVariation(ai: Ai, before: Buffer, after: Buffer, threshold = DEFAULT_EDGE_THRESHOLD): Promise<VariationCheck> {
  const [vision, edgeScore] = await Promise.all([ai.checkStructure(before, after), structureEdgeScore(before, after)]);
  const edgeVerdict: Verdict = edgeScore >= threshold ? "aprovado" : "revisar";
  return {
    checkerVersion: CHECKER_VERSION,
    visionModel: ai.visionModel,
    vision,
    edgeScore,
    edgeThreshold: threshold,
    edgeVerdict,
    verdict: worstVerdict(vision.veredito, edgeVerdict),
    checkedAt: new Date().toISOString(),
  };
}

export interface GenerationRequest {
  ai: Ai;
  templates: Templates;
  working: Buffer;
  room: Room;
  style: Style;
  standard: Standard;
  quality: Quality;
  variations?: number;
  furnitureColors?: readonly FurnitureColorId[];
  customInstructions?: string;
  references?: Buffer[];
  longEdge?: number;
  fixedSize?: { width: number; height: number };
  edgeThreshold?: number;
}

export interface GeneratedVariation {
  index: number;
  image: Buffer;
  sha256: string;
  check: VariationCheck;
}

export interface GenerationOutcome {
  createdAt: string;
  model: string;
  quality: Quality;
  size: string;
  templateVersion: string;
  prompt: string;
  input: Buffer;
  inputSha256: string;
  usage: unknown;
  variations: GeneratedVariation[];
}

export async function runGeneration(req: GenerationRequest): Promise<GenerationOutcome> {
  const { width = 0, height = 0 } = await sharp(req.working).metadata();
  const size = req.fixedSize ?? matchingSize(width, height, req.longEdge ?? DEFAULT_LONG_EDGE);
  const sizeStr = `${size.width}x${size.height}`;
  const input = await fitExactly(req.working, size.width, size.height);
  const references = req.references ?? [];
  const prompt = buildPrompt(req.templates, req.room, req.style, req.standard, {
    furnitureColors: req.furnitureColors,
    hasReferences: references.length > 0,
    customInstructions: req.customInstructions,
  });
  const createdAt = new Date().toISOString();
  const count = req.variations ?? 3;
  // Uma chamada por variação, cada uma com uma disposição de móveis diferente, para as opções não saírem parecidas.
  const layouts = count > 1 ? Array.from({ length: count }, (_, i) => req.templates.layouts[i % req.templates.layouts.length]) : [];
  const prompts = count > 1 ? layouts.map((l) => `${prompt}\n${l}`) : [prompt];
  const results = await Promise.all(prompts.map((p) => req.ai.generate(input, p, sizeStr, 1, req.quality, references)));
  const images = results.flatMap((r) => r.images);
  const recordedPrompt = layouts.length ? [prompt, "", ...layouts.map((l, i) => `Variação ${i + 1}: ${l}`)].join("\n") : prompt;

  const variations = await Promise.all(
    images.map(async (raw, i) => {
      const image = await fitExactly(raw, size.width, size.height);
      return { index: i + 1, image, sha256: sha256(image), check: await checkVariation(req.ai, input, image, req.edgeThreshold) };
    }),
  );

  return {
    createdAt,
    model: req.ai.imageModel,
    quality: req.quality,
    size: sizeStr,
    templateVersion: req.templates.version,
    prompt: recordedPrompt,
    input,
    inputSha256: sha256(input),
    usage: sumUsage(results.map((r) => r.usage)),
    variations,
  };
}

function sumUsage(usages: unknown[]): unknown {
  let input = 0, output = 0, counted = false;
  for (const u of usages as ({ input_tokens?: number; output_tokens?: number } | null)[]) {
    if (typeof u?.input_tokens === "number") {
      input += u.input_tokens;
      output += u.output_tokens ?? 0;
      counted = true;
    }
  }
  return counted ? { input_tokens: input, output_tokens: output, calls: usages.length } : usages[0] ?? null;
}

export const defaultChoice = (variations: { index: number; check?: VariationCheck }[]) =>
  variations.find((v) => v.check?.verdict !== "reprovado")?.index ?? null;
