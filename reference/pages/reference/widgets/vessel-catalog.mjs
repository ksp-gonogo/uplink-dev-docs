const FEED = "reference/examples/vessel-catalog/vessels.ts";

export default {
  kind: "widget",
  widget: "vessel-catalog",
  scene: {
    fixture: "reference/fixtures/vessel-catalog.json",
    w: 10,
    h: 10,
    feeds: {
      "trackingStation.catalog": { file: FEED, export: "trackingCatalog" },
    },
  },
  examples: [{ id: "vessel-catalog", file: FEED }],
  extensions: {
    "vessel-catalog.updates": "reference/examples/vessel-catalog/updates.tsx",
  },
  stories: {
    states: "widgets/vessel-catalog.stories.tsx",
    extensions: {
      "vessel-catalog.updates": "extensions/slots.stories.tsx#PlantedSlotVesselCatalogUpdates",
      "vessel-catalog.sections": "extensions/slots.stories.tsx#PlantedSlotVesselCatalogSections",
      "vessel-catalog.actions": "extensions/slots.stories.tsx#PlantedSlotVesselCatalogActions",
      "vessel-catalog.badges": "extensions/slots.stories.tsx#PlantedSlotVesselCatalogBadges",
    },
  },
};
