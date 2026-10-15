export default {
  kind: "widget",
  widget: "ground-track",
  scene: { fixture: "reference/fixtures/ground-track.json", w: 9, h: 18 },
  examples: [{ id: "ground-track" }],
  extensions: {
    "ground-track.overlay": "reference/examples/ground-track/overlay.tsx",
    "ground-track.base": "reference/examples/ground-track/base.tsx",
  },
  stories: {
    states: "widgets/ground-track.stories.tsx",
    extensions: {
      "ground-track.overlay": "extensions/slots.stories.tsx#PlantedSlotGroundTrackOverlay",
      "ground-track.base": "extensions/slots.stories.tsx#PlantedSlotGroundTrackBase",
      "ground-track.sections": "extensions/slots.stories.tsx#PlantedSlotGroundTrackSections",
      "ground-track.actions": "extensions/slots.stories.tsx#PlantedSlotGroundTrackActions",
      "ground-track.badges": "extensions/slots.stories.tsx#PlantedSlotGroundTrackBadges",
    },
  },
};
