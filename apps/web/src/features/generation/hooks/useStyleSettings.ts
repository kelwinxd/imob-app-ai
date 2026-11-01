import { useState } from "react";
import {
  instructionRuleViolation, MAX_FURNITURE_COLORS,
  type FurnitureColorId, type Standard, type StagingDetailDTO, type Style, type UpdateStagingInput,
} from "@imob/shared";

// Escolhas da etapa Estilo ficam locais até o "Próximo", que salva na decoração.
export function useStyleSettings(staging: StagingDetailDTO) {
  const [style, setStyle] = useState<Style | null>(staging.style);
  const [standard, setStandard] = useState<Standard | null>(staging.standard ?? "medio");
  const [colors, setColors] = useState<FurnitureColorId[]>(staging.furnitureColors as FurnitureColorId[]);
  const [instructions, setInstructions] = useState(staging.customInstructions);

  const toggleColor = (id: FurnitureColorId) =>
    setColors((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : cur.length >= MAX_FURNITURE_COLORS ? cur : [...cur, id]));

  const instructionsChanged = instructions.trim() !== staging.customInstructions;
  const colorsChanged = colors.length !== staging.furnitureColors.length || colors.some((c) => !staging.furnitureColors.includes(c));
  const dirty = style !== staging.style || standard !== staging.standard || colorsChanged || instructionsChanged;

  const toInput = (): UpdateStagingInput => ({
    ...(style ? { style } : {}),
    ...(standard ? { standard } : {}),
    furnitureColors: colors,
    ...(instructionsChanged ? { customInstructions: instructions.trim() } : {}),
  });

  return {
    style,
    standard,
    colors,
    instructions,
    instructionError: instructionRuleViolation(instructions),
    setStyle,
    setStandard,
    toggleColor,
    setInstructions,
    dirty,
    toInput,
  };
}

export type StyleSettings = ReturnType<typeof useStyleSettings>;
