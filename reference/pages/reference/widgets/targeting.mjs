export default {
  kind: "widget",
  widget: "targeting",
  scene: {
    fixture: "reference/fixtures/targeting.json",
    w: 6,
    h: 9,
  },
  examples: [{ id: "targeting" }],
  /*
   * No worked example for targeting.camera: it takes a live picture of the target, and the published
   * packages carry no video source to draw one from, so any example would be a placeholder.
   */
  extensions: {
    "targeting.overlay": "reference/examples/targeting/overlay.tsx",
  },
  stories: {
    states: "widgets/targeting.stories.tsx",
    extensions: {
      "targeting.camera": "extensions/slots.stories.tsx#PlantedSlotTargetingCamera",
      "targeting.overlay": "extensions/slots.stories.tsx#PlantedSlotTargetingOverlay",
      "targeting.sections": "extensions/slots.stories.tsx#PlantedSlotTargetingSections",
      "targeting.actions": "extensions/slots.stories.tsx#PlantedSlotTargetingActions",
      "targeting.badges": "extensions/slots.stories.tsx#PlantedSlotTargetingBadges",
    },
  },
};
