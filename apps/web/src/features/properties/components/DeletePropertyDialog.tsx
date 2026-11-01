import { plural } from "../../../shared/lib/format";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";

interface DeletePropertyDialogProps {
  property: { title: string; photoCount: number; stagingCount: number; publishedCount: number } | null;
  deleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePropertyDialog({ property, deleting, error, onConfirm, onCancel }: DeletePropertyDialogProps) {
  return (
    <ConfirmDialog
      open={Boolean(property)}
      title={`Excluir “${property?.title ?? ""}”?`}
      confirmLabel="Excluir imóvel"
      tone="danger"
      loading={deleting}
      error={error}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {property && (
        <>
          Apaga {plural(property.photoCount, "foto", "fotos")}, {plural(property.stagingCount, "decoração", "decorações")} e os dossiês deste imóvel.
          {property.publishedCount > 0 && " As páginas públicas deixam de funcionar."} Não dá para desfazer.
        </>
      )}
    </ConfirmDialog>
  );
}
