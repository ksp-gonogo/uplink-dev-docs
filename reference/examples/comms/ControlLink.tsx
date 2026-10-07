import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Badge } from "@ksp-gonogo/ui-kit";

export function ControlLink() {
  const connectivity = useTelemetry("comms.connectivity");
  if (connectivity.state === "pending") return <Badge tone="offline">Waiting</Badge>;
  if (connectivity.state !== "observed" && connectivity.state !== "held") return <Badge tone="offline">No link data</Badge>;
  const { connected, hasLocalControl } = connectivity.value;
  return connected ? (
    <Badge tone="go">Link up</Badge>
  ) : (
    <Badge tone={hasLocalControl ? "caution" : "nogo"}>{hasLocalControl ? "Local control" : "No control"}</Badge>
  );
}
