// #region example
import { StatusIndicator } from "@ksp-gonogo/ui-kit";

export function LinkHealth({ ok }: { ok: boolean }) {
  return (
    <StatusIndicator tone={ok ? "go" : "nogo"} live>
      {ok ? "Uplink established" : "No uplink to the vessel"}
    </StatusIndicator>
  );
}
// #endregion example
