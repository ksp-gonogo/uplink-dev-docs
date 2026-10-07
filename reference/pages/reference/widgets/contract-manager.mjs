export default {
  kind: "widget",
  widget: "contract-manager",
  scene: { fixture: "reference/fixtures/contract-manager.json", w: 8, h: 10 },
  examples: [{ id: "contract-manager" }],
  extensions: {
  },
  stories: {
    states: "widgets/contract-manager.stories.tsx",
    extensions: {
      "contract-manager.sections": "extensions/slots.stories.tsx#PlantedSlotContractManagerSections",
      "contract-manager.actions": "extensions/slots.stories.tsx#PlantedSlotContractManagerActions",
      "contract-manager.badges": "extensions/slots.stories.tsx#PlantedSlotContractManagerBadges",
    },
  },
};
