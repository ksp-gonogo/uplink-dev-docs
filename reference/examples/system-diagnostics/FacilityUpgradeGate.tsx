import { GateOutcome, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Badge } from "@ksp-gonogo/ui-kit";

export function FacilityUpgradeGate() {
  const report = useTelemetry("system.uplink.gates");
  if (report.state !== "observed" && report.state !== "held") return <Badge tone="offline">No gate data</Badge>;
  const gate = report.value.gates.find((g) => g.command === "career.facility.upgrade");
  if (!gate) return <Badge>Not gated</Badge>;
  return gate.verdict.outcome === GateOutcome.Fail ? (
    <Badge tone="nogo" title={gate.verdict.detail}>Locked</Badge>
  ) : (
    <Badge tone="go">Available</Badge>
  );
}
