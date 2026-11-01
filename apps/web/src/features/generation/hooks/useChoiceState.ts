import { useState } from "react";
import { MAX_VARIATIONS, ROOM_LABELS, type StagingDetailDTO, type StagingPhotoDTO } from "@imob/shared";
import type { Focus } from "../components/VariationPanel";

interface Stage {
  src: string | null;
  label: string;
  overlay: { title: string; subtitle?: string; spinning?: boolean } | null;
  canCompare: boolean;
  /** Imagem em resolução cheia para tela cheia e download. */
  full: { src: string; download: { url: string; fileName: string } } | null;
}

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

  const stage = ((): Stage => {
    if (!selected) return { src: null, label: "", overlay: null, canCompare: false, full: null };
    const room = selected.roomConfirmed ? ROOM_LABELS[selected.roomConfirmed] : "Foto";
    if (selected.status === "generating") {
      return {
        src: focusedVariation?.previewUrl ?? selected.originalUrl,
        label: room,
        overlay: { title: "Decorando e conferindo a estrutura…", subtitle: "Acompanhe o progresso logo abaixo", spinning: true },
        canCompare: false,
        full: null,
      };
    }
    if (!focusedVariation) {
      return {
        src: selected.originalUrl,
        label: `${room} · foto enviada`,
        overlay: { title: "Ainda sem decoração", subtitle: "Escolha quantas variações quer e clique em Gerar." },
        canCompare: false,
        full: null,
      };
    }
    const slug = room.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
    if (comparing) {
      return {
        src: selected.originalUrl,
        label: `${room} · Original (antes)`,
        overlay: null,
        canCompare: true,
        full: { src: selected.originalUrl, download: { url: selected.originalUrl, fileName: `${slug}-original.jpg` } },
      };
    }
    return {
      src: focusedVariation.previewUrl,
      label: `${room} · Variação ${focusedVariation.index}`,
      overlay: null,
      canCompare: true,
      full: { src: focusedVariation.imageUrl, download: { url: focusedVariation.imageUrl, fileName: `${slug}-variacao-${focusedVariation.index}.png` } },
    };
  })();
  const [expanded, setExpanded] = useState(false);

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
    expanded: expanded && stage.full !== null,
    setExpanded,
    variationCount,
    setVariationCount,
    stage,
    toGenerate: photos.filter((p) => p.needsGeneration).length,
    generating: photos.filter((p) => p.status === "generating").length,
  };
}
