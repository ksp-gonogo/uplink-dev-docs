const FEED = "reference/examples/experiments/stock.ts";

export default {
  kind: "widget",
  widget: "experiments",
  scene: {
    fixture: "reference/fixtures/experiments.json",
    w: 8,
    h: 16,
    feeds: { "science.instruments": { file: FEED, export: "scienceInstruments" } },
  },
  examples: [{ id: "experiments", file: FEED }],
  extensions: {
    "experiments.instrument": "reference/examples/experiments/instrument.tsx",
    "experiments.instruments": "reference/examples/experiments/instruments.ts",
  },
  stories: {
    states: "widgets/experiments.stories.tsx",
    extensions: {
      "experiments.instrument": "extensions/slots.stories.tsx#PlantedSlotExperimentsInstrument",
      "experiments.instruments": "extensions/slots.stories.tsx#PlantedSlotExperimentsInstruments",
      "experiments.sections": "extensions/slots.stories.tsx#PlantedSlotExperimentsSections",
      "experiments.actions": "extensions/slots.stories.tsx#PlantedSlotExperimentsActions",
      "experiments.badges": "extensions/slots.stories.tsx#PlantedSlotExperimentsBadges",
    },
  },
};
