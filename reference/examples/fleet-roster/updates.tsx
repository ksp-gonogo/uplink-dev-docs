import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge, Text } from "@ksp-gonogo/ui-kit";

// In an Uplink this call is `src/uplink.ts`, which exports `uplink`; its `id` is the plugin's own.
const uplink = defineUplinkClient({
  id: "fleetsilencenotes",
  version: "1.0.0",
  name: "Fleet Silence Notes",
  description: "Adds a note to the Fleet Roster updates when a vessel has gone silent.",
});

function SilenceNote({
  vesselId,
  compact,
}: SlotProps<"fleet-roster.updates">) {
  // `fleet.silence` lists every vessel in one payload; a single vessel's own state is on `silence.<guid>.state`.
  const silence = useTelemetry("fleet.silence");
  if (silence.state !== "observed") return null;
  const entry = silence.value.vessels.find((v) => v.vesselId === vesselId);
  // `state` is "Nominal" (in contact), "Silent" or "Lost"; `deadlineBasis` names what the deadline rests on.
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
