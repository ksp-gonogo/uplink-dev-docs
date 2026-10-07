export default {
  kind: "widget",
  widget: "ship-map",
  scene: {
    fixture: "reference/fixtures/ship-map.json",
    w: 8,
    h: 10,
    feeds: { "vessel.parts": { file: "reference/examples/ship-map/parts.ts", export: "vesselParts" } },
  },
  examples: [{ id: "ship-map", file: "reference/examples/ship-map/parts.ts" }],
  extensions: {
    "ship-map.overlay": "reference/examples/ship-map/overlay.tsx",
    "ship-map.part-meters": "reference/examples/ship-map/part-meters.ts",
    "ship-map.part-meta": "reference/examples/ship-map/part-meta.ts",
  },
  stories: {
    states: "widgets/ship-map.stories.tsx",
    extensions: {
      "ship-map.overlay": "extensions/slots.stories.tsx#PlantedSlotShipMapOverlay",
      "ship-map.part-meters": "extensions/slots.stories.tsx#PlantedSlotShipMapPartMeters",
      "ship-map.part-meta": "extensions/slots.stories.tsx#PlantedSlotShipMapPartMeta",
    },
  },
};
