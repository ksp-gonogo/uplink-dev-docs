export default {
  kind: "widget",
  widget: "transfer-window",
  scene: { fixture: "reference/fixtures/transfer-window.json", w: 12, h: 20 },
  examples: [{ id: "transfer-window" }],
  stories: {
    states: "widgets/transfer-window.stories.tsx",
    extensions: {
      "transfer-window.sections": "extensions/slots.stories.tsx#PlantedSlotTransferWindowSections",
      "transfer-window.actions": "extensions/slots.stories.tsx#PlantedSlotTransferWindowActions",
      "transfer-window.badges": "extensions/slots.stories.tsx#PlantedSlotTransferWindowBadges",
    },
  },
};
