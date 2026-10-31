export const ROOMS = ["sala", "quarto", "cozinha", "banheiro", "sala_jantar", "varanda", "escritorio", "area_servico", "outro"] as const;
export type Room = (typeof ROOMS)[number];

export const ROOM_LABELS: Record<Room, string> = {
  sala: "Sala de estar",
  quarto: "Quarto",
  cozinha: "Cozinha",
  banheiro: "Banheiro",
  sala_jantar: "Sala de jantar",
  varanda: "Varanda",
  escritorio: "Escritório",
  area_servico: "Área de serviço",
  outro: "Outro",
};

export const STYLES = ["moderno", "escandinavo", "classico", "industrial", "minimalista", "praiano"] as const;
export type Style = (typeof STYLES)[number];

export const STYLE_INFO: Record<Style, { label: string; description: string }> = {
  moderno: { label: "Moderno", description: "Linhas retas, tons neutros, madeira clara e metal preto" },
  escandinavo: { label: "Escandinavo", description: "Madeira clara, tecidos naturais, aconchegante" },
  classico: { label: "Clássico", description: "Madeira escura, tons creme e terrosos" },
  industrial: { label: "Industrial", description: "Couro, metal escuro, madeira de demolição" },
  minimalista: { label: "Minimalista", description: "Poucos móveis, formas simples, paleta clara" },
  praiano: { label: "Praiano", description: "Fibras naturais, linho, areia e azul suave" },
};

export const STANDARDS = ["economico", "medio", "alto"] as const;
export type Standard = (typeof STANDARDS)[number];

export const STANDARD_INFO: Record<Standard, { label: string; description: string }> = {
  economico: { label: "Econômico", description: "Móveis simples e funcionais" },
  medio: { label: "Médio", description: "Boa qualidade, sem luxo" },
  alto: { label: "Alto", description: "Design e materiais nobres" },
};

export const QUALITIES = ["low", "medium", "high"] as const;
export type Quality = (typeof QUALITIES)[number];

export const VERDICTS = ["aprovado", "revisar", "reprovado"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const STRUCTURE_ELEMENTS = ["paredes", "janelas", "portas", "piso", "teto", "perspectiva", "luz_natural"] as const;
export type StructureElement = (typeof STRUCTURE_ELEMENTS)[number];

export const STRUCTURE_ELEMENT_LABELS: Record<StructureElement, string> = {
  paredes: "Paredes",
  janelas: "Janelas",
  portas: "Portas",
  piso: "Piso",
  teto: "Teto",
  perspectiva: "Perspectiva",
  luz_natural: "Luz natural",
};

export interface PortalFormat {
  id: string;
  label: string;
  width: number;
  height: number;
  fit: "inside" | "blurpad";
}

// Valores provisórios: conferir as especificações atuais de cada portal antes do piloto.
export const PORTALS: readonly PortalFormat[] = [
  { id: "zap", label: "Zap Imóveis", width: 1920, height: 1440, fit: "inside" },
  { id: "vivareal", label: "Viva Real", width: 1920, height: 1440, fit: "inside" },
  { id: "olx", label: "OLX", width: 1600, height: 1200, fit: "inside" },
  { id: "instagram_feed", label: "Instagram feed", width: 1080, height: 1350, fit: "blurpad" },
  { id: "instagram_stories", label: "Instagram stories", width: 1080, height: 1920, fit: "blurpad" },
];

export const MAX_PHOTOS_PER_PROPERTY = 20;
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
