import {
  BRAND_COLOR_PATTERN, DEFAULT_BRAND_COLOR, formatPhoneBR, formatPriceBRL, PURPOSE_LABELS,
  type PageTheme, type PropertyDetails,
} from "@imob/shared";
import { escapeXml as esc } from "./seal";

export interface PublicPagePhoto {
  roomLabel: string;
  decoratedSrc: string;
}

export interface PublicPageBrand {
  name: string;
  color: string;
  logoSrc: string | null;
  whatsapp: string;
  phone: string;
  creci: string;
}

export interface PublicPageInput {
  title: string;
  publishedAt: Date;
  registry: string;
  photos: PublicPagePhoto[];
  brand?: PublicPageBrand;
  details?: PropertyDetails;
  theme?: PageTheme;
  /** Mostra uma faixa no topo e troca o rodapé (pré-visualização antes de publicar). */
  preview?: boolean;
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;

function facts(d: PropertyDetails | undefined): string[] {
  if (!d) return [];
  const out: string[] = [];
  if (d.areaM2) out.push(`${d.areaM2.toLocaleString("pt-BR")} m²`);
  if (d.bedrooms) out.push(plural(d.bedrooms, "quarto", "quartos"));
  if (d.bathrooms) out.push(plural(d.bathrooms, "banheiro", "banheiros"));
  if (d.parkingSpots) out.push(plural(d.parkingSpots, "vaga", "vagas"));
  return out;
}

// Texto branco ou escuro, o que tiver mais contraste com a cor da marca.
function readableOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? "#1d1d1b" : "#ffffff";
}

const waDigits = (digits: string) => (digits.length === 10 || digits.length === 11 ? `55${digits}` : digits);
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "•";

const DARK_VARS = "--bg:#141413;--fg:#ecebe6;--muted:#a3a29b;--card:#1d1d1b;--line:#33322e;color-scheme:dark";

// Os três temas vão sempre no CSS; o atributo data-theme do <html> escolhe qual vale.
// Assim a prévia do app troca o tema na hora, sem recarregar a página.
const THEME_CSS = `html[data-theme=escuro]{${DARK_VARS}}
html[data-theme=claro]{color-scheme:light}
@media (prefers-color-scheme:dark){html[data-theme=auto]{${DARK_VARS}}}`;

const CSS = (brand: string, onBrand: string) => `
:root{--brand:${brand};--on-brand:${onBrand};--bg:#fafaf8;--fg:#1d1d1b;--muted:#5f5f5a;--card:#fff;--line:#e7e5df}
${THEME_CSS}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:inherit}
.wrap{max-width:1120px;margin:0 auto;padding:0 16px}
.top{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;height:64px}
.brand{display:flex;align-items:center;gap:10px;font-weight:600;text-decoration:none;min-width:0}
.brand img{max-height:40px;max-width:160px;object-fit:contain}
.brand .mono{width:38px;height:38px;border-radius:10px;background:var(--brand);color:var(--on-brand);display:grid;place-items:center;font-size:15px;flex:none}
.brand span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:44px;padding:0 18px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;white-space:nowrap}
.btn-brand{background:var(--brand);color:var(--on-brand)}
.wa-short{display:none}
@media (max-width:520px){.top .btn{height:38px;padding:0 12px;font-size:14px}.wa-long{display:none}.wa-short{display:inline}.brand img{max-width:104px;max-height:32px}}
.btn-ghost{border:1px solid var(--line);background:var(--card)}
.hero{display:grid;grid-template-columns:1fr;gap:20px;padding:24px 0 8px}
@media (min-width:900px){.hero{grid-template-columns:3fr 2fr;gap:32px;align-items:center;padding-top:32px}}
.hero-img{position:relative;border-radius:18px;overflow:hidden;background:var(--line)}
.hero-img img{display:block;width:100%;height:auto}
.tag{display:inline-block;border-radius:999px;padding:3px 12px;font-size:13px;font-weight:600;background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--fg)}
h1{font-size:clamp(1.6rem,4vw,2.3rem);line-height:1.15;margin:10px 0 6px;letter-spacing:-.01em}
.loc{color:var(--muted);margin:0}
.price{font-size:1.6rem;font-weight:700;margin:14px 0 4px}
.facts{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0;padding:0;list-style:none}
.facts li{border:1px solid var(--line);background:var(--card);border-radius:10px;padding:6px 12px;font-size:14px}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.note{font-size:13px;color:var(--muted);margin-top:14px}
.note a{color:var(--fg)}
section.block{padding:28px 0}
h2{font-size:1.3rem;margin:0 0 14px}
.desc{white-space:pre-line;max-width:72ch;color:var(--fg)}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.gallery a{display:block;border-radius:14px;overflow:hidden;background:var(--line)}
.gallery img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;transition:transform .3s}
.gallery a:hover img{transform:scale(1.03)}
.preview-bar{background:#fde68a;color:#422006;text-align:center;font:600 13px/1.4 system-ui,sans-serif;padding:8px 12px}
figure{margin:0}
.gallery figcaption{font-size:13px;color:var(--muted);padding:6px 2px 0}
.contact{background:var(--brand);color:var(--on-brand);border-radius:20px;padding:24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin:12px 0 28px}
.contact h2{margin:0}
.contact p{margin:4px 0 0;opacity:.9}
.contact .btn{background:var(--on-brand);color:var(--brand)}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px;padding:20px 0 36px}
footer p{margin:4px 0}
`;

export function renderPublicPage({ title, publishedAt, registry, photos, brand, details, theme = "auto", preview = false }: PublicPageInput): string {
  const color = brand && BRAND_COLOR_PATTERN.test(brand.color) ? brand.color : DEFAULT_BRAND_COLOR;
  const onBrand = readableOn(color);
  const cover = photos[0];
  const location = [details?.neighborhood, details?.city].filter(Boolean).join(", ");
  const factList = facts(details);
  const whatsappHref = brand?.whatsapp
    ? `https://wa.me/${waDigits(brand.whatsapp)}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel "${title}".`)}`
    : null;
  const phoneHref = brand?.phone ? `tel:+${waDigits(brand.phone)}` : null;
  const date = publishedAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const header = brand
    ? `<header class="top"><div class="wrap">
  <span class="brand">${brand.logoSrc ? `<img src="${esc(brand.logoSrc)}" alt="${esc(brand.name)}">` : `<span class="mono">${esc(initials(brand.name))}</span>`}<span>${esc(brand.name)}</span></span>
  ${whatsappHref ? `<a class="btn btn-brand" href="${esc(whatsappHref)}" target="_blank" rel="noopener"><span class="wa-long">Falar no WhatsApp</span><span class="wa-short">WhatsApp</span></a>` : ""}
</div></header>`
    : "";

  const hero = `<section class="hero">
  ${cover ? `<div class="hero-img"><img src="${esc(cover.decoratedSrc)}" alt="${esc(cover.roomLabel)} decorada com IA"></div>` : ""}
  <div>
    ${details?.purpose ? `<span class="tag">${esc(PURPOSE_LABELS[details.purpose])}</span>` : ""}
    <h1>${esc(title)}</h1>
    ${location ? `<p class="loc">${esc(location)}</p>` : ""}
    ${details?.price ? `<p class="price">${esc(formatPriceBRL(details.price))}${details.purpose === "aluguel" ? "<small style=\"font-size:.55em;font-weight:500\"> /mês</small>" : ""}</p>` : ""}
    ${factList.length ? `<ul class="facts">${factList.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
    ${whatsappHref || phoneHref ? `<div class="cta">
      ${whatsappHref ? `<a class="btn btn-brand" href="${esc(whatsappHref)}" target="_blank" rel="noopener">Agendar visita</a>` : ""}
      ${phoneHref ? `<a class="btn btn-ghost" href="${esc(phoneHref)}">Ligar</a>` : ""}
    </div>` : ""}
    <p class="note">Imagens ilustrativas: fotos decoradas virtualmente com IA; os móveis não acompanham o imóvel.</p>
  </div>
</section>`;

  const description = details?.description
    ? `<section class="block"><h2>Sobre o imóvel</h2><p class="desc">${esc(details.description)}</p></section>`
    : "";

  const gallery = photos.length > 1
    ? `<section class="block"><h2>Fotos</h2><div class="gallery">${photos
        .map((p) => `<figure><a href="${esc(p.decoratedSrc)}" target="_blank" rel="noopener"><img src="${esc(p.decoratedSrc)}" alt="${esc(p.roomLabel)}" loading="lazy"></a><figcaption>${esc(p.roomLabel)}</figcaption></figure>`)
        .join("")}</div></section>`
    : "";

  const contact = brand && (whatsappHref || phoneHref)
    ? `<section class="contact">
  <div><h2>Gostou do imóvel?</h2><p>Fale com ${esc(brand.name)} e agende uma visita.</p></div>
  <a class="btn" href="${esc(whatsappHref ?? phoneHref!)}"${whatsappHref ? ' target="_blank" rel="noopener"' : ""}>${whatsappHref ? "Chamar no WhatsApp" : "Ligar agora"}</a>
</section>`
    : "";

  const footerInfo = brand
    ? [brand.name, brand.creci ? `CRECI ${brand.creci}` : "", brand.phone ? formatPhoneBR(brand.phone) : ""].filter(Boolean).join(" · ")
    : "";

  return `<!doctype html>
<html lang="pt-BR" data-theme="${esc(theme)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="theme-color" content="${esc(color)}">
<title>${esc(title)}${brand ? ` · ${esc(brand.name)}` : ""}</title>
<style>${CSS(color, onBrand)}</style>
</head>
<body>
${preview ? `<div class="preview-bar">Prévia: é assim que a página vai ficar depois de publicada</div>` : ""}
${header}
<main class="wrap">
${hero}
${description}
${gallery}
${contact}
</main>
<footer><div class="wrap">
  ${footerInfo ? `<p>${esc(footerInfo)}</p>` : ""}
  <p>${preview ? "Prévia, ainda não publicada." : `Publicado em ${esc(date)}. Registro de verificação ${esc(registry.slice(0, 16))}.`}</p>
</div></footer>
</body>
</html>
`;
}

// Mostrada no lugar da página quando o corretor desativa a publicação.
export function renderUnavailablePage({ brandName, theme = "auto" }: { brandName?: string; theme?: PageTheme }): string {
  const who = brandName ? `Fale com ${esc(brandName)} para saber mais.` : "Fale com o corretor responsável para saber mais.";
  return `<!doctype html>
<html lang="pt-BR" data-theme="${esc(theme)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Página indisponível</title>
<style>
:root{--bg:#fafaf8;--fg:#1d1d1b;--muted:#5f5f5a;--card:#fff;--line:#e7e5df}
${THEME_CSS}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:420px;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:32px 24px}
h1{margin:0 0 8px;font-size:22px}
p{margin:0;color:var(--muted)}
</style>
</head>
<body>
<main>
<h1>Este anúncio não está disponível</h1>
<p>A página foi desativada pelo anunciante. ${who}</p>
</main>
</body>
</html>`;
}
