// #region example
import { Badge, Inline } from "@ksp-gonogo/ui-kit";

export function LinkBadges({ connected }: { connected: boolean }) {
  return (
    <Inline gap="xs">
      <Badge tone={connected ? "go" : "nogo"}>
        {connected ? "LINKED" : "NO LINK"}
      </Badge>
      <Badge tone="info" size="sm">
        S-BAND
      </Badge>
    </Inline>
  );
}
// #endregion example
