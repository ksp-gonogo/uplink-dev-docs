import { Badge, Tooltip } from "@ksp-gonogo/ui-kit";

export function Tip() {
  return (
    <Tooltip text="Signal relayed through two satellites" focusable>
      <Badge tone="info">Relayed</Badge>
    </Tooltip>
  );
}
