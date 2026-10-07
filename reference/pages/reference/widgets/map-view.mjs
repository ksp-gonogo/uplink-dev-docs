export default {
  kind: "widget",
  widget: "map-view",
  scene: { fixture: "reference/fixtures/map-view.json", w: 9, h: 18 },
  examples: [{ id: "map-view" }],
  extensions: {
    "map-view.overlay": "reference/examples/map-view/overlay.tsx",
    "map-view.base": "reference/examples/map-view/base.tsx",
  },
  stories: {
    states: "widgets/map-view.stories.tsx",
    extensions: {
      "map-view.overlay": "extensions/slots.stories.tsx#PlantedSlotMapViewOverlay",
      "map-view.base": "extensions/slots.stories.tsx#PlantedSlotMapViewBase",
      "map-view.sections": "extensions/slots.stories.tsx#PlantedSlotMapViewSections",
      "map-view.actions": "extensions/slots.stories.tsx#PlantedSlotMapViewActions",
      "map-view.badges": "extensions/slots.stories.tsx#PlantedSlotMapViewBadges",
    },
  },
};
