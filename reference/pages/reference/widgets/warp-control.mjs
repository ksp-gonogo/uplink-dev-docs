export default {
  kind: "widget",
  widget: "warp-control",
  scene: {
    fixture: "reference/fixtures/warp-control.json",
    w: 6,
    h: 10,
    feeds: { "time.warp": { file: "reference/examples/warp-control/warp.ts", export: "timeWarp" } },
  },
  examples: [{ id: "warp-control", file: "reference/examples/warp-control/warp.ts" }],
  extensions: {
    "warp-control.stepper": "reference/examples/warp-control/stepper.tsx",
  },
  stories: {
    states: "widgets/warp-control.stories.tsx",
    extensions: {
      "warp-control.stepper": "extensions/slots.stories.tsx#PlantedSlotWarpControlStepper",
      "warp-control.sections": "extensions/slots.stories.tsx#PlantedSlotWarpControlSections",
      "warp-control.actions": "extensions/slots.stories.tsx#PlantedSlotWarpControlActions",
      "warp-control.badges": "extensions/slots.stories.tsx#PlantedSlotWarpControlBadges",
    },
  },
};
