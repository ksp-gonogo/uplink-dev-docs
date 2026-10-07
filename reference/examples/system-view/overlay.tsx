import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "system-scale",
  version: "1.0.0",
  name: "System Scale",
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
        stroke="var(--color-info-mark)"
        strokeWidth={2}
      />
      <text x={left} y={y - 10} fill="var(--color-info-text)" fontSize={11}>
        1,000 km
      </text>
    </svg>
  );
}

registerAugment({
  id: "system-scale-bar",
  augments: "system-view.overlay",
  component: ScaleBar,
  owner: uplink,
});
