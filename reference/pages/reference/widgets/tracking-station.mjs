export default {
  kind: "widget",
  widget: "tracking-station",
  scene: { fixture: "reference/fixtures/tracking-station.json", w: 9, h: 12 },
  examples: [{ id: "tracking-station" }],
  extensions: {
    "tracking-station.overlay": "reference/examples/tracking-station/overlay.tsx",
    "tracking-station.vessel-status": "reference/examples/tracking-station/vessel-status.ts",
    "tracking-station.entities": "reference/examples/tracking-station/entities.ts",
    // The frame is a tile setting, so the example pins its own entry for Kerbin, the body the scene centres on.
    "tracking-station.projection": { file: "reference/examples/tracking-station/projection.ts", config: { projection: "pair-frames:1" } },
  },
  stories: {
    states: "widgets/tracking-station.stories.tsx",
    extensions: {
      "tracking-station.overlay": "extensions/slots.stories.tsx#PlantedSlotTrackingStationOverlay",
      "tracking-station.vessel-status": "extensions/slots.stories.tsx#PlantedSlotTrackingStationVesselStatus",
      "tracking-station.entities": "extensions/slots.stories.tsx#PlantedSlotTrackingStationEntities",
      "tracking-station.projection": "extensions/slots.stories.tsx#PlantedSlotTrackingStationProjection",
      "tracking-station.sections": "extensions/slots.stories.tsx#PlantedSlotTrackingStationSections",
      "tracking-station.actions": "extensions/slots.stories.tsx#PlantedSlotTrackingStationActions",
      "tracking-station.badges": "extensions/slots.stories.tsx#PlantedSlotTrackingStationBadges",
    },
  },
};
