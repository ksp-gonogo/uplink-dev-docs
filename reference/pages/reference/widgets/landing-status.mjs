export default {
  kind: "widget",
  widget: "landing-status",
  scene: { fixture: "reference/fixtures/landing-status.json", w: 10, h: 32 },
  examples: [{ id: "landing-status" }],
  extensions: { plots: "reference/examples/landing-status/plots.ts" },
  stories: {
    extensions: {
      "plots": "extensions/slots.stories.tsx#PlantedSlotPlots",
      "landing-status.sections": "extensions/slots.stories.tsx#PlantedSlotLandingStatusSections",
      "landing-status.actions": "extensions/slots.stories.tsx#PlantedSlotLandingStatusActions",
      "landing-status.badges": "extensions/slots.stories.tsx#PlantedSlotLandingStatusBadges",
    },
  },
};
