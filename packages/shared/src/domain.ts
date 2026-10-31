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

export const FURNITURE_COLORS = [
  { id: "branco", label: "Branco", hex: "#f4f3ef", prompt: "branco" },
  { id: "bege", label: "Bege", hex: "#d8c7a8", prompt: "bege e areia" },
  { id: "cinza", label: "Cinza claro", hex: "#b9bbbd", prompt: "cinza claro" },
  { id: "grafite", label: "Grafite", hex: "#4a4d52", prompt: "grafite" },
  { id: "preto", label: "Preto", hex: "#1f1f1f", prompt: "preto" },
  { id: "madeira_clara", label: "Madeira clara", hex: "#d2a877", prompt: "madeira clara natural" },
  { id: "madeira_escura", label: "Madeira escura", hex: "#6b4429", prompt: "madeira escura" },
  { id: "verde", label: "Verde", hex: "#6f8a5e", prompt: "verde oliva" },
  { id: "azul", label: "Azul", hex: "#4f6f8f", prompt: "azul petróleo" },
  { id: "terracota", label: "Terracota", hex: "#c0694a", prompt: "terracota" },
  { id: "mostarda", label: "Mostarda", hex: "#d1a23a", prompt: "amarelo mostarda" },
] as const;
export const FURNITURE_COLOR_IDS = FURNITURE_COLORS.map((c) => c.id) as unknown as readonly [FurnitureColorId, ...FurnitureColorId[]];
export type FurnitureColorId = (typeof FURNITURE_COLORS)[number]["id"];
export const MAX_FURNITURE_COLORS = 3;
export const MAX_REFERENCE_IMAGES = 4;

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
