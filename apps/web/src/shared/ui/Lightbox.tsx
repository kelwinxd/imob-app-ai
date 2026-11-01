import { useEffect, type ReactNode } from "react";
import { XIcon } from "./icons";

interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
  actions?: ReactNode;
}

export function Lightbox({ src, alt, onClose, actions }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-50 flex flex-col bg-black/92" onClick={onClose}>
      <div className="flex items-center justify-end gap-2 p-3" onClick={(e) => e.stopPropagation()}>
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <XIcon />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-6">
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}
