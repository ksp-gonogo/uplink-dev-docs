import {
  defineUplinkClient,
  type SystemViewProjection,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "pair-frames",
  version: "1.0.0",
  name: "Pair Frames",
  description: "Reference example: Pair Frames.",
});

uplink.registerContribution({
  id: "rotating-with-parent",
  contributes: "system-view.projection",
  deps: ["system.bodies"],
  compute: (topics): SystemViewProjection[] => {
    const bodies = topics["system.bodies"]?.bodies ?? [];
    return bodies.flatMap((body) => {
      if (body.parentIndex == null || body.parentIndex === body.index) return [];
      return [
        {
          id: `pair-frames:${body.index}`,
          label: `Turn with ${body.name} and its parent`,
          choice: { kind: "rotating-pulsating", bodyIndex: body.index },
          extent: { kind: "auto-fit-metres" },
          frameBodyIndex: body.index,
        },
      ];
    });
  },
});
