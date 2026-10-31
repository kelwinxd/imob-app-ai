import { useState } from "react";
import { MAX_VARIATIONS, ROOM_LABELS, type StagingDetailDTO, type StagingPhotoDTO } from "@imob/shared";
import type { Focus } from "../components/VariationPanel";

const defaultFocus = (p: StagingPhotoDTO): Focus | null => p.chosenVariationId ?? p.variations[0]?.id ?? null;

// Qual foto está selecionada, qual variação aparece em destaque e se o usuário está comparando com a original.
export function useChoiceState(staging: StagingDetailDTO) {
  const photos = staging.photos.filter((p) => p.include);
  const [selectedId, setSelectedId] = useState<string | null>(photos[0]?.photoId ?? null);
  const [focusByPhoto, setFocusByPhoto] = useState<Record<string, Focus>>({});
  const [comparing, setComparing] = useState(false);
  const [variationCount, setVariationCount] = useState(MAX_VARIATIONS);

  const selected = photos.find((p) => p.photoId === selectedId) ?? photos[0] ?? null;
  const stored = selected ? focusByPhoto[selected.photoId] : undefined;
  // Depois de gerar de novo, os ids antigos somem: volta para a variação escolhida.
  const focus = selected && stored && selected.variations.some((v) => v.id === stored) ? stored : selected ? defaultFocus(selected) : null;
  const focusedVariation = selected?.variations.find((v) => v.id === focus) ?? null;

  const stage = (() => {
    if (!selected) return { src: null, label: "", overlay: null, canCompare: false };
    const room = selected.roomConfirmed ? ROOM_LABELS[selected.roomConfirmed] : "Foto";
    if (selected.status === "generating") {
      return {
        src: focusedVariation?.previewUrl ?? selected.originalUrl,
        label: room,
        overlay: { title: "Decorando e conferindo a estrutura…", subtitle: "Costuma levar menos de um minuto por foto", spinning: true },
        canCompare: false,
      };
    }
    if (!focusedVariation) {
      return {
        src: selected.originalUrl,
        label: `${room} · foto enviada`,
        overlay: { title: "Ainda sem decoração", subtitle: "Escolha quantas variações quer e clique em Gerar." },
        canCompare: false,
      };
    }
    if (comparing) return { src: selected.originalUrl, label: `${room} · Original (antes)`, overlay: null, canCompare: true };
    return { src: focusedVariation.previewUrl, label: `${room} · Variação ${focusedVariation.index}`, overlay: null, canCompare: true };
  })();

  return {
    photos,
    selected,
    select: (id: string) => {
      setSelectedId(id);
      setComparing(false);
    },
    focus: focus ?? "",
    setFocus: (f: Focus) => {
      if (!selected) return;
      setFocusByPhoto((cur) => ({ ...cur, [selected.photoId]: f }));
      setComparing(false);
    },
    comparing,
    setComparing,
    variationCount,
    setVariationCount,
    stage,
    toGenerate: photos.filter((p) => p.needsGeneration).length,
    generating: photos.filter((p) => p.status === "generating").length,
  };
}
