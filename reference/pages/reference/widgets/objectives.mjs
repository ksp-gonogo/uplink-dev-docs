const FLIGHT_FEED = "reference/examples/objectives/flight.ts";

export default {
  kind: "widget",
  widget: "objectives",
  scene: { fixture: "reference/fixtures/objectives.json", w: 8, h: 10, feeds: { "vessel.flight": { file: FLIGHT_FEED, export: "vesselFlight" } } },
  examples: [{ id: "objectives", file: FLIGHT_FEED }],
  extensions: {
    "objectives.source": "reference/examples/objectives/source.tsx",
  },
  stories: {
    states: "widgets/objectives.stories.tsx",
    extensions: {
      "objectives.source": "extensions/slots.stories.tsx#PlantedSlotObjectivesSource",
      "objectives.sections": "extensions/slots.stories.tsx#PlantedSlotObjectivesSections",
      "objectives.actions": "extensions/slots.stories.tsx#PlantedSlotObjectivesActions",
      "objectives.badges": "extensions/slots.stories.tsx#PlantedSlotObjectivesBadges",
    },
  },
};
