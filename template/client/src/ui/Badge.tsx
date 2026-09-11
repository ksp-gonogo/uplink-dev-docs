// #region example
import { Badge, Inline } from "@ksp-gonogo/ui-kit";

export function LinkBadges({ connected }: { connected: boolean }) {
  return (
    <Inline gap="xs">
      <Badge severity={connected ? "nominal" : "offline"} live>
        {connected ? "LINKED" : "NO LINK"}
      </Badge>
      <Badge size="sm">S-BAND</Badge>
    </Inline>
  );
}
// #endregion example
