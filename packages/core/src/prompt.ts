import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { FURNITURE_COLORS, ROOMS, STANDARDS, STYLES, type FurnitureColorId, type Room, type Standard, type Style } from "@imob/shared";
import { joinPt } from "./seal";

const TEMPLATES_FILE = fileURLToPath(new URL("../prompts/templates.json", import.meta.url));

const TemplatesSchema = z.object({
  version: z.string(),
  base: z.string(),
  preserve: z.string(),
  colors: z.string(),
  references: z.string(),
  rooms: z.record(z.enum(ROOMS), z.object({ label: z.string(), furniture: z.string() })),
  styles: z.record(z.enum(STYLES), z.string()),
  standards: z.record(z.enum(STANDARDS), z.string()),
});

export type Templates = z.infer<typeof TemplatesSchema>;

export async function loadTemplates(): Promise<Templates> {
  return TemplatesSchema.parse(JSON.parse(await readFile(TEMPLATES_FILE, "utf8")));
}

export interface PromptOptions {
  furnitureColors?: readonly FurnitureColorId[];
  hasReferences?: boolean;
}

export function buildPrompt(t: Templates, room: Room, style: Style, standard: Standard, options: PromptOptions = {}): string {
  const r = t.rooms[room];
  const colors: string[] = [];
  for (const id of options.furnitureColors ?? []) {
    const color = FURNITURE_COLORS.find((c) => c.id === id);
    if (color) colors.push(color.prompt);
  }
  return [
    t.base,
    `Cômodo: ${r.label}. Inclua: ${r.furniture}.`,
    `${t.styles[style]}.`,
    `${t.standards[standard]}.`,
    colors.length ? t.colors.replace("{cores}", joinPt(colors)) : null,
    options.hasReferences ? t.references : null,
    t.preserve,
  ]
    .filter(Boolean)
    .join("\n");
}
