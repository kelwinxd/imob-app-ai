import type { Verdict } from "@imob/shared";
import { Badge } from "../../../shared/ui/Badge";
import { VERDICT_INFO } from "../lib/verdict";

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <Badge tone={VERDICT_INFO[verdict].tone}>{VERDICT_INFO[verdict].label}</Badge>;
}
