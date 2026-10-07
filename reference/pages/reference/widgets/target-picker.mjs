export default {
  kind: "widget",
  widget: "target-picker",
  scene: {
    fixture: "reference/fixtures/target-picker.json",
    w: 6,
    h: 14,
  },
  examples: [{ id: "target-picker" }],
  stories: {
    states: "widgets/target-picker.stories.tsx",
    extensions: {
      "target-picker.sections": "extensions/slots.stories.tsx#PlantedSlotTargetPickerSections",
      "target-picker.actions": "extensions/slots.stories.tsx#PlantedSlotTargetPickerActions",
      "target-picker.badges": "extensions/slots.stories.tsx#PlantedSlotTargetPickerBadges",
    },
  },
};
