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
  description: "Reference example: Pad Turnaround.",
});

function Turnaround({
  occupied,
  occupantName,
}: SlotProps<"launch-director.pad">) {
  // `null` means the site does not report it, which says nothing either way.
  if (occupied !== true) return null;
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
