const FEED = "reference/examples/astronaut-complex/applicants.ts";

export default {
  kind: "widget",
  widget: "astronaut-complex",
  scene: {
    fixture: "reference/fixtures/astronaut-complex.json",
    w: 8,
    h: 14,
    feeds: { "spaceCenter.astronautComplex": { file: FEED, export: "astronautComplex" } },
  },
  examples: [{ id: "astronaut-complex", file: FEED }],
  extensions: {
    "astronaut-complex.crew": "reference/examples/astronaut-complex/crew.tsx",
    "astronaut-complex.crew-badge": "reference/examples/astronaut-complex/crew-badge.tsx",
    "astronaut-complex.tab": "reference/examples/astronaut-complex/tab.tsx",
    "astronaut-complex.readouts": "reference/examples/astronaut-complex/readouts.ts",
  },
  stories: {
    states: "widgets/astronaut-complex.stories.tsx",
    extensions: {
      "astronaut-complex.crew": "extensions/slots.stories.tsx#PlantedSlotAstronautComplexCrew",
      "astronaut-complex.crew-badge": "extensions/slots.stories.tsx#PlantedSlotAstronautComplexCrewBadge",
      "astronaut-complex.tab": "extensions/slots.stories.tsx#PlantedSlotAstronautComplexTab",
      "astronaut-complex.readouts": "extensions/slots.stories.tsx#PlantedSlotAstronautComplexReadouts",
      "astronaut-complex.sections": "extensions/slots.stories.tsx#PlantedSlotAstronautComplexSections",
      "astronaut-complex.actions": "extensions/slots.stories.tsx#PlantedSlotAstronautComplexActions",
      "astronaut-complex.badges": "extensions/slots.stories.tsx#PlantedSlotAstronautComplexBadges",
    },
  },
};
