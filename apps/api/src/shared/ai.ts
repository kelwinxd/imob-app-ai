import { createAi, loadTemplates, type Ai, type Templates } from "@imob/core";
import { env } from "../env";

let ai: Ai | undefined;
let templates: Promise<Templates> | undefined;

export const getAi = () =>
  (ai ??= createAi({ apiKey: env.OPENAI_API_KEY, imageModel: env.IMAGE_MODEL, visionModel: env.VISION_MODEL, mock: env.AI_MOCK }));

export const getTemplates = () => (templates ??= loadTemplates());
