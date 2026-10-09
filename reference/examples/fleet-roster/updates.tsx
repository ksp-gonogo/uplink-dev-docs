import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge, Text } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "fleet-silence-notes",
  version: "1.0.0",
  name: "Fleet Silence Notes",
  description: "Reference example: Fleet Silence Notes.",
});

function SilenceNote({
  vesselId,
  compact,
}: SlotProps<"fleet-roster.updates">) {
  const silence = useTelemetry("fleet.silence");
  if (silence.state !== "observed") return null;
  const entry = silence.value.vessels.find((v) => v.vesselId === vesselId);
  if (!entry || entry.state === "Nominal") return null;
  if (compact) {
    return (
      <Badge tone="warn" size="sm">
        {entry.state}
      </Badge>
    );
  }
  return (
    <Text size="sm" level="muted">
      Not answering, a {entry.deadlineBasis} deadline applies
    </Text>
  );
}

registerAugment({
  id: "fleet-silence-note",
  augments: "fleet-roster.updates",
  component: SilenceNote,
  channels: ["fleet.silence"],
  owner: uplink,
});
