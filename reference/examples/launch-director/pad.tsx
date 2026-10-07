import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "pad-turnaround",
  version: "1.0.0",
  name: "Pad Turnaround",
});

function Turnaround({
  occupied,
  occupantName,
}: SlotProps<"launch-director.pad">) {
  if (!occupied) return null;
  return (
    <Badge tone="warn" size="sm">
      Clear {occupantName ?? "the pad"} before the next launch
    </Badge>
  );
}

registerAugment({
  id: "pad-turnaround-note",
  augments: "launch-director.pad",
  component: Turnaround,
  owner: uplink,
});
