const FEED = "reference/examples/comm-signal/route.ts";

export default {
  kind: "widget",
  widget: "comm-signal",
  scene: {
    fixture: "reference/fixtures/comm-signal.json",
    w: 8,
    h: 10,
    feeds: { "comms.path": { file: FEED, export: "commsPath" } },
  },
  examples: [{ id: "comm-signal", file: FEED }],
  /*
   * No worked example for comm-signal.hop-rates: a hop's bitrate has to come from a mod that measures one,
   * and no published Topic carries it, so any example would invent the figure it contributes.
   */
  stories: {
    states: "widgets/comm-signal.stories.tsx",
    extensions: {
      "comm-signal.hop-rates": "extensions/slots.stories.tsx#PlantedSlotCommSignalHopRates",
      "comm-signal.sections": "extensions/slots.stories.tsx#PlantedSlotCommSignalSections",
      "comm-signal.actions": "extensions/slots.stories.tsx#PlantedSlotCommSignalActions",
      "comm-signal.badges": "extensions/slots.stories.tsx#PlantedSlotCommSignalBadges",
    },
  },
};
