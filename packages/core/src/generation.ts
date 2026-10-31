import sharp from "sharp";
import type { Quality, Room, Standard, Style, VariationCheck, Verdict } from "@imob/shared";
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
  const prompt = buildPrompt(req.templates, req.room, req.style, req.standard);
  const createdAt = new Date().toISOString();
  const result = await req.ai.generate(input, prompt, sizeStr, req.variations ?? 3, req.quality);

  const variations = await Promise.all(
    result.images.map(async (raw, i) => {
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
    prompt,
    input,
    inputSha256: sha256(input),
    usage: result.usage,
    variations,
  };
}

export const defaultChoice = (variations: { index: number; check?: VariationCheck }[]) =>
  variations.find((v) => v.check?.verdict !== "reprovado")?.index ?? null;
