import { escapeXml as esc, joinPt } from "./seal";

export interface PublicPagePhoto {
  roomLabel: string;
  originalSrc: string;
  decoratedSrc: string;
  items: string[];
}

export interface PublicPageInput {
  title: string;
  publishedAt: Date;
  registry: string;
  photos: PublicPagePhoto[];
}

const CSS = `
:root{--bg:#fafaf8;--fg:#1d1d1b;--muted:#5f5f5a;--card:#fff;--line:#e4e2dc;--accent:#8a5a2b}
@media (prefers-color-scheme:dark){:root{--bg:#161614;--fg:#ecebe6;--muted:#a3a29b;--card:#1f1f1c;--line:#34332f;--accent:#d9a46a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header,main,footer{max-width:1100px;margin:0 auto;padding:0 16px}
header{padding-top:32px}h1{font-size:1.6rem;margin:0 0 12px}
.aviso{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent);padding:12px 16px;border-radius:8px;margin:0 0 24px}
section{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:20px}
h2{font-size:1.1rem;margin:0 0 12px}
.par{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:700px){.par{grid-template-columns:1fr}}
figure{margin:0}img{width:100%;height:auto;display:block;border-radius:8px}
figcaption{font-size:.85rem;color:var(--muted);margin-top:6px}
.itens{font-size:.9rem;color:var(--muted);margin:12px 0 0}
footer{color:var(--muted);font-size:.8rem;padding-bottom:32px}
`;

export function renderPublicPage({ title, publishedAt, registry, photos }: PublicPageInput): string {
  const sections = photos
    .map(
      (p) => `<section>
  <h2>${esc(p.roomLabel)}</h2>
  <div class="par">
    <figure><img src="${esc(p.originalSrc)}" alt="${esc(p.roomLabel)}: foto original" loading="lazy"><figcaption>Foto original, sem alterações</figcaption></figure>
    <figure><img src="${esc(p.decoratedSrc)}" alt="${esc(p.roomLabel)}: versão decorada com IA" loading="lazy"><figcaption>Decorada com IA (móveis ilustrativos)</figcaption></figure>
  </div>
  ${p.items.length ? `<p class="itens">Itens ilustrativos adicionados: ${esc(joinPt(p.items))}.</p>` : ""}
</section>`,
    )
    .join("\n");
  const date = publishedAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}: fotos originais</title>
<style>${CSS}</style>
</head>
<body>
<header>
  <h1>${esc(title)}</h1>
  <p class="aviso">Algumas fotos deste anúncio foram decoradas virtualmente com inteligência artificial. Os móveis e objetos são ilustrativos e não acompanham o imóvel. Abaixo, cada foto original ao lado da versão decorada.</p>
</header>
<main>
${sections}
</main>
<footer>Publicado em ${esc(date)}. Registro de verificação ${esc(registry.slice(0, 16))}.</footer>
</body>
</html>
`;
}
