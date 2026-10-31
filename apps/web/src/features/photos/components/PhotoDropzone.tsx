import { useRef, useState, type DragEvent } from "react";
import { ACCEPTED_IMAGE_TYPES } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { UploadIcon } from "../../../shared/ui/icons";
import { ProgressBar } from "../../../shared/ui/ProgressBar";

interface PhotoDropzoneProps {
  onFiles: (files: File[]) => void;
  uploading: boolean;
  progress: number;
  remaining: number;
  compact?: boolean;
}

export function PhotoDropzone({ onFiles, uploading, progress, remaining, compact }: PhotoDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const disabled = uploading || remaining === 0;

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) onFiles([...e.dataTransfer.files]);
  };

  if (uploading) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
        <ProgressBar value={progress} label={progress >= 99 ? "Processando fotos…" : "Enviando fotos…"} />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition-colors",
        compact ? "px-4 py-5" : "px-6 py-10",
        dragging ? "border-brand-500 bg-brand-50" : "border-stone-300 bg-white hover:border-brand-400",
        disabled && "opacity-60",
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <UploadIcon />
      </span>
      <div>
        <p className="font-medium text-stone-900">{compact ? "Adicionar mais fotos" : "Envie as fotos do imóvel"}</p>
        <p className="mt-0.5 text-sm text-stone-600">
          {remaining === 0 ? "Limite de fotos atingido." : `De 8 a 15 fotos dos cômodos vazios · JPG, PNG ou WEBP · cabem mais ${remaining}`}
        </p>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        disabled={disabled}
        aria-label="Selecionar fotos"
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
