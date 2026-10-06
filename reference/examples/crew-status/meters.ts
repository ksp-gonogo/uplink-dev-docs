import { defineUplinkClient, value } from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crew-experience",
  version: "1.0.0",
  name: "Crew Experience",
});

const TOP_LEVEL = 5;

uplink.registerContribution({
  id: "experience-meters",
  contributes: "crew-status.meters",
  deps: ["vessel.crew"],
  compute: (topics) => {
    const crew = topics["vessel.crew"]?.crew ?? [];
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
