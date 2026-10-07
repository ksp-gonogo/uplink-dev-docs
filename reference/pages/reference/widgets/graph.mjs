export default {
  kind: "widget",
  widget: "graph",
  scene: {
    fixture: "reference/fixtures/graph.json",
    w: 10,
    h: 8,
    // Graph plots only the series a tile is set up with, so the scene carries that setting.
    config: {
      windowSec: 600,
      series: [
        { id: "alt", key: "vessel.flight.altitudeAsl", label: "Altitude", type: "line", axis: "primary" },
        { id: "ospd", key: "vessel.flight.orbitalSpeed", label: "Orbital speed", type: "line", axis: "secondary" },
      ],
    },
  },
  examples: [{ id: "graph" }],
  stories: {
    states: "widgets/graph.stories.tsx",
    extensions: {
      "graph.sections": "extensions/slots.stories.tsx#PlantedSlotGraphSections",
      "graph.actions": "extensions/slots.stories.tsx#PlantedSlotGraphActions",
      "graph.badges": "extensions/slots.stories.tsx#PlantedSlotGraphBadges",
    },
  },
};
