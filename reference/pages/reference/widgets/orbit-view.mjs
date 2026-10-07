export default {
  kind: "widget",
  widget: "orbit-view",
  scene: { fixture: "reference/fixtures/orbit-view.json", w: 9, h: 18 },
  examples: [{ id: "orbit-view" }],
  extensions: {
    "orbit-view.overlay": "reference/examples/orbit-view/overlay.tsx",
  },
  stories: {
    states: "widgets/orbit-view.stories.tsx",
    extensions: {
      "orbit-view.overlay": "extensions/slots.stories.tsx#PlantedSlotOrbitViewOverlay",
      "orbit-view.sections": "extensions/slots.stories.tsx#PlantedSlotOrbitViewSections",
      "orbit-view.actions": "extensions/slots.stories.tsx#PlantedSlotOrbitViewActions",
      "orbit-view.badges": "extensions/slots.stories.tsx#PlantedSlotOrbitViewBadges",
    },
  },
};
