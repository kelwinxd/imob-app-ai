import PDFDocument from "pdfkit";
import { STRUCTURE_ELEMENTS, STRUCTURE_ELEMENT_LABELS, type VariationCheck, type Verdict } from "@imob/shared";
import { toJpeg } from "./imaging";

// As fontes padrão do PDF só cobrem Latin-1/WinAnsi; o texto vindo do modelo pode trazer outros caracteres.
const WINANSI_EXTRA = new Set("–—‘’“”•…€·".split(""));
const clean = (s: string) => [...s].map((c) => (c.charCodeAt(0) <= 0xff || WINANSI_EXTRA.has(c) ? c : "?")).join("");

const fmtDate = (iso: string) =>
  `${new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília) · ${iso} (UTC)`;

export interface DossierPhoto {
  label: string;
  roomLabel: string;
  roomSuggestedLabel: string | null;
  sourceName: string;
  receivedAt: string;
  originalWidth: number;
  originalHeight: number;
  exifPresent: boolean;
  sha256: string;
  original: Buffer;
  final: Buffer;
  finalSha256: string;
  sealText: string;
  operatorConfirmedReview: boolean;
  generation: { createdAt: string; model: string; quality: string; size: string; templateVersion: string; prompt: string };
  chosen: { index: number; sha256: string; check: VariationCheck | null };
  others: { index: number; verdict: Verdict | null }[];
}

export interface DossierInput {
  title: string;
  style: string;
  standard: string;
  publicUrl: string;
  qrPng: Buffer;
  auditHead: string;
  photos: DossierPhoto[];
}

export async function buildDossier({ title, style, standard, publicUrl, qrPng, auditHead, photos }: DossierInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: clean(`Dossiê de staging virtual — ${title}`) } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((res) => doc.on("end", () => res(Buffer.concat(chunks))));

  const W = doc.page.width - 100;
  const h1 = (t: string) => doc.font("Helvetica-Bold").fontSize(18).fillColor("#111").text(clean(t));
  const h2 = (t: string) => doc.moveDown(0.6).font("Helvetica-Bold").fontSize(11).fillColor("#111").text(clean(t));
  const kv = (k: string, v: string) =>
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111").text(clean(`${k}: `), { continued: true }).font("Helvetica").text(clean(v));
  const mono = (t: string) => doc.font("Courier").fontSize(8).fillColor("#333").text(t);

  const first = photos[0]?.generation;
  h1("Dossiê de staging virtual");
  doc.moveDown(0.3).font("Helvetica").fontSize(12).fillColor("#333").text(clean(title));
  doc.moveDown();
  kv("Gerado em", fmtDate(new Date().toISOString()));
  kv("Fotos publicadas", String(photos.length));
  kv("Estilo / padrão", `${style} / ${standard}`);
  if (first) {
    kv("Modelo de imagem", `${first.model} (qualidade ${first.quality})`);
    kv("Versão das instruções", first.templateVersion);
  }
  kv("Página pública", publicUrl);
  doc.moveDown(0.5);
  doc.image(qrPng, { width: 110 });
  doc.moveDown(0.5);
  kv("Registro encadeado (último hash)", "");
  mono(auditHead);
  doc.moveDown();
  doc.font("Helvetica").fontSize(9).fillColor("#444").text(
    clean(
      "Este documento registra, para cada foto do anúncio, a foto original (identificada pelo hash SHA-256 dos bytes recebidos), a versão decorada por IA que foi publicada, as instruções usadas, o resultado da verificação de estrutura e o selo aplicado. As fotos originais são guardadas sem alteração. O registro de eventos é encadeado por hash: qualquer alteração retroativa quebra a cadeia. Este dossiê não é laudo técnico nem parecer jurídico.",
    ),
    { width: W },
  );

  for (const p of photos) {
    doc.addPage();
    h1(`Foto ${p.label} — ${p.roomLabel}`);
    doc.moveDown(0.5);

    const y = doc.y;
    const imgW = (W - 15) / 2;
    const imgH = imgW * 0.75;
    doc.image(await toJpeg(p.original, 900, 80), 50, y, { fit: [imgW, imgH], align: "center", valign: "center" });
    doc.image(await toJpeg(p.final, 900, 80), 50 + imgW + 15, y, { fit: [imgW, imgH], align: "center", valign: "center" });
    doc.font("Helvetica").fontSize(8).fillColor("#555");
    doc.text("Original", 50, y + imgH + 4, { width: imgW });
    doc.text(clean(`Decorada — variação ${p.chosen.index} (publicada)`), 50 + imgW + 15, y + imgH + 4, { width: imgW });
    doc.x = 50;
    doc.y = y + imgH + 22;

    h2("Foto original");
    kv("Arquivo recebido", p.sourceName);
    kv("Recebido em", fmtDate(p.receivedAt));
    kv("Dimensões", `${p.originalWidth} x ${p.originalHeight}`);
    kv("Metadados EXIF", p.exifPresent ? "presentes no original; removidos de todas as versões públicas" : "ausentes");
    kv("SHA-256", "");
    mono(p.sha256);

    h2("Geração");
    kv("Cômodo", `${p.roomLabel}${p.roomSuggestedLabel ? ` (sugerido pela IA: ${p.roomSuggestedLabel})` : ""}`);
    kv("Gerado em", fmtDate(p.generation.createdAt));
    kv("Modelo", `${p.generation.model} · qualidade ${p.generation.quality} · ${p.generation.size}`);
    kv("Instruções", `versão ${p.generation.templateVersion}`);
    doc.font("Helvetica-Oblique").fontSize(7.5).fillColor("#555").text(clean(p.generation.prompt), { width: W });
    kv("SHA-256 da variação publicada", "");
    mono(p.chosen.sha256);
    kv("SHA-256 da imagem com selo", "");
    mono(p.finalSha256);

    h2("Verificação de estrutura");
    writeCheck(doc, p.chosen.check, kv);
    if (p.operatorConfirmedReview) kv("Observação", "variação marcada para revisão e confirmada pelo operador antes da publicação");
    if (p.others.length) kv("Outras variações", p.others.map((v) => `${v.index}: ${v.verdict ?? "sem verificação"}`).join(" · "));

    h2("Selo aplicado");
    doc.font("Helvetica").fontSize(9).fillColor("#111").text(clean(p.sealText), { width: W });
  }

  doc.end();
  return done;
}

function writeCheck(doc: PDFKit.PDFDocument, c: VariationCheck | null, kv: (k: string, v: string) => unknown) {
  if (!c) {
    kv("Resultado", "não verificada");
    return;
  }
  kv("Veredito final", c.verdict);
  kv("Versão da trava", c.checkerVersion);
  kv("Camada de visão", `${c.vision.veredito} (modelo ${c.visionModel})`);
  for (const key of STRUCTURE_ELEMENTS) {
    const e = c.vision[key];
    kv(`  ${STRUCTURE_ELEMENT_LABELS[key]}`, e.mudou ? `ALTERADO — ${e.detalhe}` : "sem alteração");
  }
  kv("Camada de bordas (faixa superior)", `correlação ${c.edgeScore.toFixed(3)} · limiar ${c.edgeThreshold} · ${c.edgeVerdict}`);
  kv("Itens adicionados", c.vision.itens_adicionados.join(", ") || "-");
  doc.moveDown(0.2);
}
