import { Button } from "../../../shared/ui/Button";
import { UploadIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";

interface LogoUploaderProps {
  logoUrl: string | null;
  busy: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export function LogoUploader({ logoUrl, busy, onUpload, onRemove }: LogoUploaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-800">Logo</span>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-40 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white p-2">
          {busy ? <Spinner /> : logoUrl ? <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-stone-400">Sem logo</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label className="relative inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-medium text-stone-800 ring-1 ring-stone-300 ring-inset hover:bg-stone-50">
            <UploadIcon size={16} /> {logoUrl ? "Trocar" : "Enviar logo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="absolute inset-0 opacity-0"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </label>
          {logoUrl && (
            <Button variant="ghost" size="sm" onClick={onRemove} disabled={busy}>
              Remover
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-stone-500">PNG com fundo transparente fica melhor. Até 2 MB.</p>
    </div>
  );
}
