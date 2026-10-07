export default {
  kind: "widget",
  widget: "system-view",
  scene: { fixture: "reference/fixtures/system-view.json", w: 9, h: 12 },
  examples: [{ id: "system-view" }],
  extensions: {
    "system-view.overlay": "reference/examples/system-view/overlay.tsx",
    "system-view.vessel-status": "reference/examples/system-view/vessel-status.ts",
    "system-view.entities": "reference/examples/system-view/entities.ts",
    // The frame is a tile setting, so the example pins its own entry for Kerbin, the body the scene centres on.
    "system-view.projection": { file: "reference/examples/system-view/projection.ts", config: { projection: "pair-frames:1" } },
  },
  stories: {
    states: "widgets/system-view.stories.tsx",
    extensions: {
      "system-view.overlay": "extensions/slots.stories.tsx#PlantedSlotSystemViewOverlay",
      "system-view.vessel-status": "extensions/slots.stories.tsx#PlantedSlotSystemViewVesselStatus",
      "system-view.entities": "extensions/slots.stories.tsx#PlantedSlotSystemViewEntities",
      "system-view.projection": "extensions/slots.stories.tsx#PlantedSlotSystemViewProjection",
      "system-view.sections": "extensions/slots.stories.tsx#PlantedSlotSystemViewSections",
      "system-view.actions": "extensions/slots.stories.tsx#PlantedSlotSystemViewActions",
      "system-view.badges": "extensions/slots.stories.tsx#PlantedSlotSystemViewBadges",
    },
  },
};
