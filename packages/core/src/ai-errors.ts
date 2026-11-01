import OpenAI from "openai";

export type AiErrorKind = "safety" | "rate_limit" | "quota" | "auth" | "connection" | "timeout" | "invalid_request" | "server" | "unknown";

export interface AiErrorInfo {
  kind: AiErrorKind;
  /** Mensagem para o corretor, em português, dizendo o que fazer. */
  message: string;
  requestId: string | null;
}

const SAFETY_CATEGORIES: Record<string, string> = {
  sexual: "conteúdo sexual ou nudez",
  "sexual/minors": "conteúdo sexual",
  violence: "violência",
  "violence/graphic": "violência",
  harassment: "assédio",
  hate: "discurso de ódio",
  "self-harm": "automutilação",
  illicit: "conteúdo ilícito",
};

function safetyMessage(raw: string): string {
  const cats = /safety_violations=\[([^\]]*)\]/.exec(raw)?.[1]?.split(",").map((c) => c.trim()).filter(Boolean) ?? [];
  const labels = [...new Set(cats.map((c) => SAFETY_CATEGORIES[c] ?? c))];
  const what = labels.length ? ` (${labels.join(", ")})` : "";
  const artHint = cats.includes("sexual")
    ? " Isso costuma acontecer com pedidos de arte clássica, barroca ou renascentista, que têm muitos nus: prefira “quadro abstrato”, “paisagem” ou “natureza-morta”."
    : "";
  return `O filtro de segurança da OpenAI bloqueou esta imagem${what}.${artHint} Ajuste o pedido específico e gere de novo.`;
}

// Traduz erros da OpenAI em mensagens que o corretor entende e consegue resolver.
export function describeAiError(err: unknown): AiErrorInfo {
  const requestId = err instanceof OpenAI.APIError ? (err.requestID ?? null) : null;
  const raw = err instanceof Error ? err.message : String(err);

  if (err instanceof OpenAI.APIConnectionTimeoutError) {
    return { kind: "timeout", requestId, message: "A OpenAI demorou demais para responder. Tente gerar de novo em instantes." };
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return { kind: "connection", requestId, message: "Não foi possível falar com a OpenAI (conexão ou antivírus bloqueando HTTPS). Verifique a internet e tente de novo." };
  }
  if (err instanceof OpenAI.APIError) {
    const code = err.code ?? "";
    if (code === "moderation_blocked" || /safety system/i.test(raw)) return { kind: "safety", requestId, message: safetyMessage(raw) };
    if (err.status === 401) return { kind: "auth", requestId, message: "A chave da OpenAI é inválida ou foi revogada. Atualize a OPENAI_API_KEY no .env." };
    if (code === "insufficient_quota" || /quota|billing/i.test(raw)) {
      return { kind: "quota", requestId, message: "A conta da OpenAI está sem créditos ou atingiu o limite de gasto. Confira o faturamento no painel da OpenAI." };
    }
    if (err.status === 429) return { kind: "rate_limit", requestId, message: "Muitas gerações ao mesmo tempo. Espere um minuto e gere de novo." };
    if (err.status && err.status >= 500) return { kind: "server", requestId, message: "A OpenAI está instável no momento. Tente de novo em alguns minutos." };
    if (err.status === 400) return { kind: "invalid_request", requestId, message: "A OpenAI recusou o pedido. Tente simplificar o pedido específico ou gerar de novo." };
  }
  return { kind: "unknown", requestId, message: "A geração falhou por um erro inesperado. Tente de novo." };
}
