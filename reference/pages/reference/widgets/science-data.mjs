const FEED = "reference/examples/science-data/aboard.ts";

export default {
  kind: "widget",
  widget: "science-data",
  scene: {
    fixture: "reference/fixtures/science-data.json",
    w: 8,
    h: 12,
    feeds: { "science.experimentBreakdown": { file: FEED, export: "experimentBreakdown" } },
  },
  examples: [{ id: "science-data", file: FEED }],
  extensions: {
    "science-data.aboard-row": "reference/examples/science-data/aboard-row.tsx",
  },
  stories: {
    states: "widgets/science-data.stories.tsx",
    extensions: {
      "science-data.aboard-row": "extensions/slots.stories.tsx#PlantedSlotScienceDataAboardRow",
      "science-data.sections": "extensions/slots.stories.tsx#PlantedSlotScienceDataSections",
      "science-data.actions": "extensions/slots.stories.tsx#PlantedSlotScienceDataActions",
      "science-data.badges": "extensions/slots.stories.tsx#PlantedSlotScienceDataBadges",
    },
  },
};
