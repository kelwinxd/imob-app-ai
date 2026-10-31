import { useState } from "react";
import { MAX_FURNITURE_COLORS, type FurnitureColorId, type Standard, type StagingDetailDTO, type Style } from "@imob/shared";

// Escolhas da etapa Estilo ficam locais até o "Próximo", que salva na decoração.
export function useStyleSettings(staging: StagingDetailDTO) {
  const [style, setStyle] = useState<Style | null>(staging.style);
  const [standard, setStandard] = useState<Standard | null>(staging.standard ?? "medio");
  const [colors, setColors] = useState<FurnitureColorId[]>(staging.furnitureColors as FurnitureColorId[]);

  const toggleColor = (id: FurnitureColorId) =>
    setColors((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : cur.length >= MAX_FURNITURE_COLORS ? cur : [...cur, id]));

  const dirty =
    style !== staging.style ||
    standard !== staging.standard ||
    colors.length !== staging.furnitureColors.length ||
    colors.some((c) => !staging.furnitureColors.includes(c));

  return { style, standard, colors, setStyle, setStandard, toggleColor, dirty };
}

export type StyleSettings = ReturnType<typeof useStyleSettings>;
