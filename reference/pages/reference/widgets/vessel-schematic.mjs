export default {
  kind: "widget",
  widget: "vessel-schematic",
  scene: {
    fixture: "reference/fixtures/vessel-schematic.json",
    w: 8,
    h: 10,
    feeds: { "vessel.parts": { file: "reference/examples/vessel-schematic/parts.ts", export: "vesselParts" } },
  },
  examples: [{ id: "vessel-schematic", file: "reference/examples/vessel-schematic/parts.ts" }],
  extensions: {
    "vessel-schematic.overlay": "reference/examples/vessel-schematic/overlay.tsx",
    "vessel-schematic.part-meters": "reference/examples/vessel-schematic/part-meters.ts",
    "vessel-schematic.part-meta": "reference/examples/vessel-schematic/part-meta.ts",
  },
  stories: {
    states: "widgets/vessel-schematic.stories.tsx",
    extensions: {
      "vessel-schematic.overlay": "extensions/slots.stories.tsx#PlantedSlotVesselSchematicOverlay",
      "vessel-schematic.part-meters": "extensions/slots.stories.tsx#PlantedSlotVesselSchematicPartMeters",
      "vessel-schematic.part-meta": "extensions/slots.stories.tsx#PlantedSlotVesselSchematicPartMeta",
    },
  },
};
