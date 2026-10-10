import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { TONE_MARK, TONE_TEXT } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "systemscale",
  version: "1.0.0",
  name: "System Scale",
  description: "Draws a scale bar over the System View.",
});

const BAR_METRES = 1_000_000;

function ScaleBar({ width, height, plotScale }: SlotProps<"system-view.overlay">) {
  const length = BAR_METRES * plotScale;
  const left = -width / 2 + 16;
  const y = height / 2 - 20;
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      style={{ position: "absolute", inset: 0 }}
    >
      <path
        d={`M ${left} ${y - 5} V ${y} H ${left + length} V ${y - 5}`}
        fill="none"
        stroke={TONE_MARK.info}
        strokeWidth={2}
      />
      <text x={left} y={y - 10} fill={TONE_TEXT.info} fontSize={11}>
        1,000 km
      </text>
    </svg>
  );
}

registerAugment({
  id: "systemscale-bar",
  augments: "system-view.overlay",
  component: ScaleBar,
  owner: uplink,
});
