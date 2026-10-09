import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { TONE_MARK, TONE_TEXT } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "launch-sites",
  version: "1.0.0",
  name: "Launch Sites",
  description: "Reference example: Launch Sites.",
});

function KerbalSpaceCenter({
  width,
  height,
  project,
  bodyName,
}: SlotProps<"map-view.overlay">) {
  if (bodyName !== "Kerbin") return null;
  const { x, y } = project(-0.0972, -74.5577);
  return (
    <svg
      width={width}
      height={height}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0 }}
    >
      <circle
        cx={x}
        cy={y}
        r={7}
        fill="none"
        stroke={TONE_MARK.info}
        strokeWidth={2}
      />
      <text x={x + 12} y={y + 4} fill={TONE_TEXT.info} fontSize={12}>
        Kerbal Space Center
      </text>
    </svg>
  );
}

registerAugment({
  id: "launch-sites-ksc",
  augments: "map-view.overlay",
  component: KerbalSpaceCenter,
  owner: uplink,
});
