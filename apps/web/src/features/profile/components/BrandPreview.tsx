interface BrandPreviewProps {
  name: string;
  color: string;
  logoUrl: string | null;
  hasWhatsapp: boolean;
}

const valid = (c: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : "#8a5a2b");

function textOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#1d1d1b" : "#ffffff";
}

export function BrandPreview({ name, color, logoUrl, hasWhatsapp }: BrandPreviewProps) {
  const c = valid(color);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "•";
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-[#fafaf8]">
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2 font-semibold">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="max-h-8 max-w-28 object-contain" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs" style={{ background: c, color: textOn(c) }}>{initials}</span>
          )}
          <span className="truncate text-sm">{name || "Sua imobiliária"}</span>
        </span>
        {hasWhatsapp && (
          <span className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: c, color: textOn(c) }}>Falar no WhatsApp</span>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="aspect-[16/9] rounded-xl bg-[url('/styles/escandinavo.jpg')] bg-cover bg-center" />
        <span className="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: `${c}24` }}>Venda</span>
        <span className="text-base font-semibold">Apartamento de exemplo</span>
        <span className="w-fit rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: c, color: textOn(c) }}>Agendar visita</span>
      </div>
    </div>
  );
}
