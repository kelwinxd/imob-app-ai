import { useEffect, useRef } from "react";
import type { PageTheme } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { useElementWidth } from "../../../shared/lib/useElementWidth";
import { ExternalIcon, MonitorIcon, PhoneIcon } from "../../../shared/ui/icons";

export type PreviewDevice = "celular" | "computador";

const DEVICE_WIDTH: Record<PreviewDevice, number> = { celular: 390, computador: 1280 };
const FRAME_HEIGHT = 900;

interface PagePreviewProps {
  src: string;
  theme: PageTheme;
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  openUrl: string | null;
}

// A página aceita o tema pelo atributo data-theme; trocar ali é instantâneo, sem recarregar o iframe.
function applyTheme(frame: HTMLIFrameElement | null, theme: PageTheme) {
  const root = frame?.contentDocument?.documentElement;
  if (root) root.dataset.theme = theme;
}

export function PagePreview({ src, theme, device, onDeviceChange, openUrl }: PagePreviewProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => applyTheme(frame.current, theme), [theme]);
  const deviceWidth = DEVICE_WIDTH[device];
  // A página é desenhada na largura real do aparelho e reduzida para caber na coluna.
  const scale = width ? Math.min(1, width / deviceWidth) : 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-stone-800">Prévia da página</p>
        <div className="flex items-center gap-1">
          <div role="radiogroup" aria-label="Tamanho da prévia" className="flex rounded-lg bg-stone-100 p-0.5">
            {(["celular", "computador"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={device === d}
                aria-label={d === "celular" ? "Ver como celular" : "Ver como computador"}
                onClick={() => onDeviceChange(d)}
                className={cn("flex h-8 w-9 items-center justify-center rounded-md transition", device === d ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800")}
              >
                {d === "celular" ? <PhoneIcon size={16} /> : <MonitorIcon size={16} />}
              </button>
            ))}
          </div>
          {openUrl && (
            <a href={openUrl} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-stone-600 hover:bg-stone-100" title="Abrir em nova aba">
              <ExternalIcon size={15} /> <span className="hidden sm:inline">Abrir</span>
            </a>
          )}
        </div>
      </div>
      <div ref={ref} className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
        <div className="mx-auto" style={{ width: deviceWidth * scale, height: FRAME_HEIGHT * scale }}>
          <iframe
            key={src}
            ref={frame}
            onLoad={() => applyTheme(frame.current, theme)}
            src={src}
            title="Prévia da página pública"
            className="origin-top-left border-0 bg-white"
            style={{ width: deviceWidth, height: FRAME_HEIGHT, transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}
