// #region example
import { Badge, Inline } from "@ksp-gonogo/ui-kit";

export function LinkBadges({ connected }: { connected: boolean }) {
  return (
    <Inline gap="related-compact">
      <Badge tone={connected ? "go" : "offline"} live>
        {connected ? "LINKED" : "NO LINK"}
      </Badge>
      <Badge size="sm">S-BAND</Badge>
    </Inline>
  );
}
// #endregion example
