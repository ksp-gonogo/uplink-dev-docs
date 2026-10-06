export const CREW_FEED = "reference/examples/crew-status/crew.ts";

/** Three kerbals in a four-seat vessel, which every Crew Status example renders on. */
export const CREW_SCENE = {
  fixture: "reference/fixtures/crew-status.json",
  w: 8,
  h: 10,
  feeds: { "vessel.crew": { file: CREW_FEED, export: "vesselCrew" } },
};

export default {
  kind: "widget",
  widget: "crew-status",
  scene: CREW_SCENE,
  examples: [{ id: "crew-status", file: CREW_FEED }],
  extensions: {
    "crew-status.row-badges": "reference/examples/crew-status/row-badges.tsx",
    "crew-status.avatar": "reference/examples/crew-status/avatar.tsx",
    "crew-status.summary": "reference/examples/crew-status/summary.tsx",
    "crew-status.row-tone": "reference/examples/crew-status/row-tone.ts",
    "crew-status.meters": "reference/examples/crew-status/meters.ts",
    "crew-status.sections": "reference/examples/crew-status/sections.tsx",
    "crew-status.actions": "reference/examples/crew-status/actions.tsx",
    "crew-status.badges": "reference/examples/crew-status/badges.ts",
  },
  stories: {
    states: "widgets/crew-status.stories.tsx",
    extensions: {
      "crew-status.row-badges": "extensions/slots.stories.tsx#PlantedSlotCrewStatusRowBadges",
      "crew-status.avatar": "extensions/slots.stories.tsx#PlantedSlotCrewStatusAvatar",
      "crew-status.summary": "extensions/slots.stories.tsx#PlantedSlotCrewStatusSummary",
      "crew-status.row-tone": "extensions/extensions.stories.tsx#PlantedCrewStatusRowTone",
      "crew-status.meters": "extensions/extensions.stories.tsx#PlantedCrewStatusMeters",
      "crew-status.badges": "extensions/extensions.stories.tsx#PlantedCrewStatusBadge",
    },
  },
};
