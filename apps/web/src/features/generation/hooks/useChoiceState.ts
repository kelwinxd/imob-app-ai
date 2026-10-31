import { useState } from "react";
import { MAX_VARIATIONS, ROOM_LABELS, type StagingDetailDTO, type StagingPhotoDTO } from "@imob/shared";
import type { Focus } from "../components/VariationPanel";

function defaultFocus(p: StagingPhotoDTO): Focus {
  return p.chosenVariationId ?? p.variations[0]?.id ?? "original";
}

// Qual foto está selecionada e o que aparece em destaque na imagem grande.
export function useChoiceState(staging: StagingDetailDTO) {
  const photos = staging.photos.filter((p) => p.include);
  const [selectedId, setSelectedId] = useState<string | null>(photos[0]?.photoId ?? null);
  const [focusByPhoto, setFocusByPhoto] = useState<Record<string, Focus>>({});
  const [variationCount, setVariationCount] = useState(MAX_VARIATIONS);

  const selected = photos.find((p) => p.photoId === selectedId) ?? photos[0] ?? null;
  const stored = selected ? focusByPhoto[selected.photoId] : undefined;
  // Depois de gerar de novo, os ids antigos somem: volta para a variação escolhida.
  const focus: Focus =
    selected && stored && (stored === "original" || selected.variations.some((v) => v.id === stored)) ? stored : selected ? defaultFocus(selected) : "original";
  const focusedVariation = selected && focus !== "original" ? selected.variations.find((v) => v.id === focus) ?? null : null;

  const stage = (() => {
    if (!selected) return { src: null, label: "", overlay: null };
    const room = selected.roomConfirmed ? ROOM_LABELS[selected.roomConfirmed] : "Foto";
    if (selected.status === "generating") {
      return { src: focusedVariation?.previewUrl ?? selected.originalUrl, label: room, overlay: { title: "Decorando e conferindo a estrutura…", subtitle: "Costuma levar menos de um minuto por foto", spinning: true } };
    }
    if (focusedVariation) return { src: focusedVariation.previewUrl, label: `${room} · Variação ${focusedVariation.index}`, overlay: null };
    if (selected.variations.length === 0) {
      return { src: selected.originalUrl, label: `${room} · Original`, overlay: { title: "Esta foto ainda não foi decorada", subtitle: "Escolha quantas variações quer e clique em Gerar." } };
    }
    return { src: selected.originalUrl, label: `${room} · Original`, overlay: null };
  })();

  return {
    photos,
    selected,
    select: setSelectedId,
    focus,
    setFocus: (f: Focus) => selected && setFocusByPhoto((cur) => ({ ...cur, [selected.photoId]: f })),
    variationCount,
    setVariationCount,
    stage,
    toGenerate: photos.filter((p) => p.needsGeneration).length,
    generating: photos.filter((p) => p.status === "generating").length,
  };
}
