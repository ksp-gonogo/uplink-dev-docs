const FEED = "reference/examples/fleet-roster/vessels.ts";

export default {
  kind: "widget",
  widget: "fleet-roster",
  scene: {
    fixture: "reference/fixtures/fleet-roster.json",
    w: 10,
    h: 10,
    feeds: {
      "system.vessels": { file: FEED, export: "systemVessels" },
      "fleet.silence": { file: FEED, export: "fleetSilence" },
    },
  },
  examples: [{ id: "fleet-roster", file: FEED }],
  extensions: {
    "fleet-roster.updates": "reference/examples/fleet-roster/updates.tsx",
  },
  stories: {
    states: "widgets/fleet-roster.stories.tsx",
    extensions: {
      "fleet-roster.updates": "extensions/slots.stories.tsx#PlantedSlotFleetRosterUpdates",
      "fleet-roster.sections": "extensions/slots.stories.tsx#PlantedSlotFleetRosterSections",
      "fleet-roster.actions": "extensions/slots.stories.tsx#PlantedSlotFleetRosterActions",
      "fleet-roster.badges": "extensions/slots.stories.tsx#PlantedSlotFleetRosterBadges",
    },
  },
};
