export default {
  kind: "widget",
  widget: "action-group",
  scene: {
    fixture: "reference/fixtures/action-group.json",
    w: 6,
    h: 9,
    feeds: { "vessel.flight": { file: "reference/examples/action-group/flight.ts", export: "vesselFlight" } },
  },
  examples: [{ id: "action-group", file: "reference/examples/action-group/flight.ts" }],
  extensions: {
    "action-group.subsystem": "reference/examples/action-group/subsystem.tsx",
  },
  stories: {
    states: "widgets/action-group.stories.tsx",
    extensions: {
      "action-group.subsystem": "extensions/slots.stories.tsx#PlantedSlotActionGroupSubsystem",
      "action-group.sections": "extensions/slots.stories.tsx#PlantedSlotActionGroupSections",
      "action-group.actions": "extensions/slots.stories.tsx#PlantedSlotActionGroupActions",
      "action-group.badges": "extensions/slots.stories.tsx#PlantedSlotActionGroupBadges",
    },
  },
};
