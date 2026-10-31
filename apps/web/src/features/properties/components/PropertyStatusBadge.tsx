import type { PropertyStatus } from "@imob/shared";
import { Badge } from "../../../shared/ui/Badge";
import { Spinner } from "../../../shared/ui/Spinner";
import { PROPERTY_STATUS } from "../lib/status";

const SPINNING: ReadonlySet<PropertyStatus> = new Set(["processing", "generating", "publishing"]);

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const s = PROPERTY_STATUS[status];
  return (
    <Badge tone={s.tone} icon={SPINNING.has(status) ? <Spinner size={12} /> : undefined}>
      {s.label}
    </Badge>
  );
}
