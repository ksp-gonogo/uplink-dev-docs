export default {
  kind: "widget",
  widget: "landing-status",
  scene: { fixture: "reference/fixtures/landing-status.json", w: 10, h: 32 },
  examples: [{ id: "landing-status" }],
  extensions: { plots: "reference/examples/landing-status/plots.ts" },
  statesNote:
    "Here the board is the grid of readouts, the site card is the card that gives the landing site its verdict, the commit clock is the countdown to the last instant a go from the command centre can still reach the vessel before ignition, the ground strip is the strip of terrain along the ground track that the side view draws, and the site grid is the top-down view around the predicted touchdown point.",
  stories: {
    states: "widgets/landing-status-scenarios.stories.tsx",
    extensions: {
      "plots": "extensions/slots.stories.tsx#PlantedSlotPlots",
      "landing-status.sections": "extensions/slots.stories.tsx#PlantedSlotLandingStatusSections",
      "landing-status.actions": "extensions/slots.stories.tsx#PlantedSlotLandingStatusActions",
      "landing-status.badges": "extensions/slots.stories.tsx#PlantedSlotLandingStatusBadges",
    },
  },
};
