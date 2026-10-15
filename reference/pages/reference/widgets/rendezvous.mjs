export default {
  kind: "widget",
  widget: "rendezvous",
  scene: {
    fixture: "reference/fixtures/rendezvous.json",
    w: 6,
    h: 9,
  },
  examples: [{ id: "rendezvous" }],
  extensions: {
    "rendezvous.camera": "reference/examples/rendezvous/camera.tsx",
    "rendezvous.overlay": "reference/examples/rendezvous/overlay.tsx",
  },
  stories: {
    states: "widgets/rendezvous.stories.tsx",
    extensions: {
      "rendezvous.camera": "extensions/slots.stories.tsx#PlantedSlotRendezvousCamera",
      "rendezvous.overlay": "extensions/slots.stories.tsx#PlantedSlotRendezvousOverlay",
      "rendezvous.sections": "extensions/slots.stories.tsx#PlantedSlotRendezvousSections",
      "rendezvous.actions": "extensions/slots.stories.tsx#PlantedSlotRendezvousActions",
      "rendezvous.badges": "extensions/slots.stories.tsx#PlantedSlotRendezvousBadges",
    },
  },
};
