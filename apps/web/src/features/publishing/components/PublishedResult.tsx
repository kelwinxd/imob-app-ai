import type { StagingDetailDTO } from "@imob/shared";
import { Button, LinkButton } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { CheckIcon, CopyIcon, DownloadIcon, ExternalIcon } from "../../../shared/ui/icons";

type Published = NonNullable<StagingDetailDTO["published"]>;

interface PublishedResultProps {
  published: Published;
  copied: boolean;
  onCopy: () => void;
}

export function PublishedResult({ published, copied, onCopy }: PublishedResultProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <div>
          <p className="text-sm font-semibold">Página pública antes/depois</p>
          <p className="mt-0.5 text-xs text-stone-600">Coloque este link no anúncio. É o mesmo que aparece no selo das fotos.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex min-h-11 flex-1 items-center overflow-x-auto rounded-xl bg-stone-100 px-3 text-sm whitespace-nowrap text-stone-800">{published.publicUrl}</code>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCopy} icon={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />} className="flex-1 sm:flex-none">
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <LinkButton variant="secondary" href={published.publicUrl} target="_blank" rel="noreferrer" icon={<ExternalIcon size={16} />} className="flex-1 sm:flex-none">
              Abrir
            </LinkButton>
          </div>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <p className="mb-2 text-sm font-semibold">Fotos com selo, por portal</p>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
            {published.portals.map((p) => (
              <LinkButton key={p.id} variant="secondary" size="sm" href={p.url} download icon={<DownloadIcon size={16} />} className="justify-start">
                {p.label}
              </LinkButton>
            ))}
          </div>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <LinkButton href={published.dossierUrl} download icon={<DownloadIcon size={16} />}>
            Baixar dossiê (PDF)
          </LinkButton>
          <p className="mt-2 break-all text-xs text-stone-500">SHA-256 do dossiê: {published.dossierSha256}</p>
        </div>
      </Card>

      <Card className="flex flex-col items-center gap-3 p-4 lg:w-56">
        <img src={published.qrcodeUrl} alt="QR code da página pública" className="h-44 w-44" />
        <LinkButton variant="ghost" size="sm" href={published.qrcodeUrl} download="qrcode.png" icon={<DownloadIcon size={16} />}>
          Baixar QR code
        </LinkButton>
      </Card>
    </div>
  );
}
