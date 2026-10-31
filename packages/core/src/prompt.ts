import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ROOMS, STANDARDS, STYLES, type Room, type Standard, type Style } from "@imob/shared";

const TEMPLATES_FILE = fileURLToPath(new URL("../prompts/templates.json", import.meta.url));

const TemplatesSchema = z.object({
  version: z.string(),
  base: z.string(),
  preserve: z.string(),
  rooms: z.record(z.enum(ROOMS), z.object({ label: z.string(), furniture: z.string() })),
  styles: z.record(z.enum(STYLES), z.string()),
  standards: z.record(z.enum(STANDARDS), z.string()),
});

export type Templates = z.infer<typeof TemplatesSchema>;

export async function loadTemplates(): Promise<Templates> {
  return TemplatesSchema.parse(JSON.parse(await readFile(TEMPLATES_FILE, "utf8")));
}

export function buildPrompt(t: Templates, room: Room, style: Style, standard: Standard): string {
  const r = t.rooms[room];
  return [
    t.base,
    `Cômodo: ${r.label}. Inclua: ${r.furniture}.`,
    `${t.styles[style]}.`,
    `${t.standards[standard]}.`,
    t.preserve,
  ].join("\n");
}
