import { useState } from "react";
import { STANDARD_INFO, STYLE_INFO, type PropertyDetailDTO, type Standard, type Style } from "@imob/shared";
import { plural } from "../../../shared/lib/format";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { SparklesIcon } from "../../../shared/ui/icons";
import { StickyActions } from "../../../shared/ui/StickyActions";
import { StandardPicker, StylePicker } from "../components/StylePicker";
import { useStartGeneration } from "../hooks/useGeneration";

export function StyleStep({ property, onGenerated }: { property: PropertyDetailDTO; onGenerated: () => void }) {
  const [style, setStyle] = useState<Style | null>(property.style);
  const [standard, setStandard] = useState<Standard | null>(property.standard ?? "medio");
  const generation = useStartGeneration(property.id);
  const included = property.photos.filter((p) => p.include).length;
  const busy = property.status === "publishing" || property.photos.some((p) => p.status === "classifying");

  const submit = () => {
    if (style && standard) generation.start({ style, standard }, { onSuccess: onGenerated });
  };

  return (
    <section className="flex flex-col gap-5" aria-labelledby="estilo-titulo">
      <div>
        <h2 id="estilo-titulo" className="text-lg font-semibold">Estilo e padrão</h2>
        <p className="mt-1 text-sm text-stone-600">Você não escreve nada: o sistema monta a instrução para a IA a partir destas escolhas.</p>
      </div>
      <Card className="flex flex-col gap-6 p-4 sm:p-6">
        <StylePicker value={style} onChange={setStyle} />
        <StandardPicker value={standard} onChange={setStandard} />
      </Card>

      {generation.error && <Alert tone="danger">{generation.error}</Alert>}

      <StickyActions
        hint={
          style && standard
            ? `${STYLE_INFO[style].label}, padrão ${STANDARD_INFO[standard].label.toLowerCase()} · ${plural(included, "foto", "fotos")} × 3 variações`
            : "Escolha um estilo para continuar"
        }
      >
        <Button size="lg" onClick={submit} disabled={!style || !standard || busy} loading={generation.starting} icon={<SparklesIcon size={18} />}>
          Decorar fotos
        </Button>
      </StickyActions>
    </section>
  );
}
