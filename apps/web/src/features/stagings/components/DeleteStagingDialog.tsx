import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";

interface DeleteStagingDialogProps {
  staging: { name: string; publicUrl: string | null } | null;
  deleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteStagingDialog({ staging, deleting, error, onConfirm, onCancel }: DeleteStagingDialogProps) {
  return (
    <ConfirmDialog
      open={Boolean(staging)}
      title={`Excluir “${staging?.name ?? ""}”?`}
      confirmLabel="Excluir decoração"
      tone="danger"
      loading={deleting}
      error={error}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      Apaga as variações, o dossiê e as imagens desta decoração. As fotos do imóvel continuam.
      {staging?.publicUrl && " A página pública desta decoração deixa de funcionar."} Não dá para desfazer.
    </ConfirmDialog>
  );
}
