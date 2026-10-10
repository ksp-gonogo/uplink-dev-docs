import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { TONE_MARK, TONE_TEXT } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "synchronous-orbit",
  version: "1.0.0",
  name: "Synchronous Orbit",
  description: "Draws the synchronous orbit as a ring on the Orbit View.",
});

function SynchronousRing({ center, scale }: SlotProps<"orbit-view.overlay">) {
  const identity = useTelemetry("vessel.identity");
  const bodies = useTelemetry("system.bodies");
  if (identity.state !== "observed" || bodies.state !== "observed") return null;
  const body = bodies.value.bodies.find(
    (candidate) => candidate.index === identity.value.parentBodyIndex,
  );
  const mu = body?.gravParameter?.magnitude;
  const period = body?.rotationPeriod?.magnitude;
  if (!mu || !period) return null;
  const radius = (mu * (period / (2 * Math.PI)) ** 2) ** (1 / 3);
  const unit = scale / 100;
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${center.x - scale} ${center.y - scale} ${scale * 2} ${scale * 2}`}
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      style={{ position: "absolute", inset: 0 }}
    >
      <circle
        cx={center.x}
        cy={center.y}
        r={radius}
        fill="none"
        stroke={TONE_MARK.info}
        strokeWidth={unit * 0.8}
        strokeDasharray={`${unit * 2} ${unit * 1.5}`}
      />
      <g transform={`translate(${center.x} ${center.y - radius - unit * 3}) scale(${unit / 2})`}>
        <text textAnchor="middle" fill={TONE_TEXT.info} fontSize={10}>
          Synchronous orbit
        </text>
      </g>
    </svg>
  );
}

registerAugment({
  id: "synchronous-orbit-ring",
  augments: "orbit-view.overlay",
  component: SynchronousRing,
  channels: ["vessel.identity", "system.bodies"],
  owner: uplink,
});
