import { STRUCTURE_ELEMENT_LABELS, STRUCTURE_ELEMENTS, type VariationCheck } from "@imob/shared";
import { CheckIcon, XIcon } from "../../../shared/ui/icons";

export function CheckDetails({ check }: { check: VariationCheck }) {
  return (
    <details className="group rounded-xl bg-stone-50 px-3 py-2 text-sm">
      <summary className="cursor-pointer select-none text-stone-700 marker:text-stone-400">Ver verificação de estrutura</summary>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        {STRUCTURE_ELEMENTS.map((k) => {
          const e = check.vision[k];
          return (
            <li key={k} className="flex items-start gap-1.5 text-xs" title={e.detalhe || undefined}>
              {e.mudou ? <XIcon size={14} className="mt-px shrink-0 text-red-600" /> : <CheckIcon size={14} className="mt-px shrink-0 text-emerald-600" />}
              <span className={e.mudou ? "text-red-700" : "text-stone-700"}>
                {STRUCTURE_ELEMENT_LABELS[k]}
                {e.mudou && e.detalhe ? `: ${e.detalhe}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-stone-500">
        Bordas da parte de cima: {check.edgeScore.toFixed(2)} (mínimo {check.edgeThreshold}). Itens adicionados: {check.vision.itens_adicionados.join(", ") || "nenhum"}.
      </p>
    </details>
  );
}
