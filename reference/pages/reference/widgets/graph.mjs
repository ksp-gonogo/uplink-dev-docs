export default {
  kind: "widget",
  widget: "graph",
  scene: {
    fixture: "reference/fixtures/graph.json",
    w: 10,
    h: 8,
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
