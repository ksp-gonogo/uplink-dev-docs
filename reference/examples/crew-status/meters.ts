import {
  defineUplinkClient,
  stillTrue,
  value,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crewexperience",
  version: "1.0.0",
  name: "Crew Experience",
  description: "Adds an experience meter to each kerbal in Crew Status.",
});

const TOP_LEVEL = 5;

uplink.registerContribution({
  id: "experience-meters",
  contributes: "crew-status.meters",
  deps: ["vessel.crew"],
  // Only the highest priority band in a slot draws, with every contribution in it. The widget's own meters are in band 0 and the default is 1, which would replace them, so 0 draws beside them.
  priority: 0,
  compute: (topics) => {
    const crew = stillTrue(topics["vessel.crew"], undefined)?.crew ?? [];
    return crew.flatMap((kerbal) => {
      const level = kerbal.experienceLevel;
      if (!kerbal.name || !level) return [];
      return [
        {
          id: `experience:${kerbal.name}`,
          label: "Experience",
          value: value("ratio", level.magnitude / TOP_LEVEL),
          row: kerbal.name,
        },
      ];
    });
  },
});
