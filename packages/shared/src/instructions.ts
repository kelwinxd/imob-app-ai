export const MAX_INSTRUCTION_LENGTH = 300;

export const INSTRUCTION_EXAMPLES = [
  "Adicione um quadro grande acima do sofá",
  "Sofá encostado na parede da esquerda",
  "Inclua uma mesa de jantar para 4 pessoas",
  "Use um tapete redondo",
];

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const FIXED = "(parede|paredes|janela|janelas|porta|portas|piso|pisos|chao|teto|forro|rodape|escada|coluna|pilar|bancada|armario embutido|revestimento|azulejo|vista)";
const CHANGE = "(remov|tir|derrub|quebr|abr|fech|aument|diminu|ampli|troc|troq|mud|mov|pint|substitu|constru|alarg|estreit|cri)";

// Primeira barreira, sem IA: pedidos que mexem na estrutura do imóvel ou saem do tema de decoração.
// O verbo e o elemento fixo precisam estar próximos, para "sofá encostado na parede" ou "mova o sofá para perto da janela" passarem.
// A revisão por IA na API e a trava de estrutura depois da geração são as outras barreiras.
const RULES: { pattern: RegExp; reason: string }[] = [
  {
    pattern: new RegExp(`\\b${FIXED}\\b(?:\\s+\\S+){0,4}?\\s+${CHANGE}\\w*`),
    reason: "O pedido não pode alterar paredes, janelas, portas, piso, teto ou outros elementos fixos do imóvel.",
  },
  {
    pattern: new RegExp(`\\b${CHANGE}\\w*(?:\\s+\\S+){0,2}?\\s+${FIXED}\\b`),
    reason: "O pedido não pode alterar paredes, janelas, portas, piso, teto ou outros elementos fixos do imóvel.",
  },
  { pattern: /\b(pessoa|pessoas|gente|crianca|criancas|mulher|homem|animal|animais|cachorro|gato|pet)\b/, reason: "Não é possível adicionar pessoas ou animais." },
  { pattern: /\b(texto|escrito|escreva|logo|logotipo|marca d.?agua|placa|letreiro|telefone|whatsapp|site|www|http)/, reason: "Não é possível adicionar textos, logotipos ou contatos na imagem." },
  { pattern: /\b(ignore|ignorar|desconsidere|esqueca)\b.*\b(regra|instruc|anterior|sistema)/, reason: "O pedido precisa ser só sobre móveis e decoração." },
  { pattern: /\b(luz do dia|noite|anoitecer|por do sol|iluminacao natural|clima|chuva|neve)\b/, reason: "A iluminação natural e a vista precisam ficar como na foto original." },
];

// Quantidade de lugares ("mesa para 4 pessoas") não é pedido para incluir pessoas.
const SEATS = /\b(para|de|com)\s+(\d+|dois|duas|tres|quatro|cinco|seis|oito|dez)\s+(pessoas|lugares)\b/g;

/** Devolve o motivo da recusa, ou null se o texto passa nas regras fixas. */
export function instructionRuleViolation(text: string): string | null {
  if (text.length > MAX_INSTRUCTION_LENGTH) return `Use no máximo ${MAX_INSTRUCTION_LENGTH} caracteres.`;
  const t = normalize(text.trim()).replace(SEATS, " ");
  if (!t) return null;
  for (const rule of RULES) if (rule.pattern.test(t)) return rule.reason;
  return null;
}
