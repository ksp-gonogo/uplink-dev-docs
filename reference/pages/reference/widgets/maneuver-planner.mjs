export default {
  kind: "widget",
  widget: "maneuver-planner",
  scene: { fixture: "reference/fixtures/maneuver-planner.json", w: 10, h: 18 },
  examples: [{ id: "maneuver-planner" }],
  stories: {
    states: "widgets/maneuver-planner.stories.tsx",
    extensions: {
      "maneuver-planner.sections": "extensions/slots.stories.tsx#PlantedSlotManeuverPlannerSections",
      "maneuver-planner.actions": "extensions/slots.stories.tsx#PlantedSlotManeuverPlannerActions",
      "maneuver-planner.badges": "extensions/slots.stories.tsx#PlantedSlotManeuverPlannerBadges",
    },
  },
};
