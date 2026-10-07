export default {
  kind: "widget",
  widget: "tech-tree",
  scene: { fixture: "reference/fixtures/tech-tree.json", w: 8, h: 10 },
  examples: [{ id: "tech-tree" }],
  extensions: {
  },
  stories: {
    states: "widgets/tech-tree.stories.tsx",
    extensions: {
      "tech-tree.sections": "extensions/slots.stories.tsx#PlantedSlotTechTreeSections",
      "tech-tree.actions": "extensions/slots.stories.tsx#PlantedSlotTechTreeActions",
      "tech-tree.badges": "extensions/slots.stories.tsx#PlantedSlotTechTreeBadges",
    },
  },
};
