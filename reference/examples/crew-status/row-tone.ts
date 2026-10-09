import {
  type CrewRowToneEntry,
  defineUplinkClient,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crew-rookies",
  version: "1.0.0",
  name: "Crew Rookies",
  description: "Reference example: Crew Rookies.",
});

uplink.registerContribution({
  id: "rookie-rows",
  contributes: "crew-status.row-tone",
  deps: ["vessel.crew"],
  compute: (topics): CrewRowToneEntry[] => {
    const crew = topics["vessel.crew"]?.crew ?? [];
    return crew.flatMap((kerbal) => {
      const rookie = kerbal.experienceLevel?.isZero() === true;
      if (!kerbal.name || !rookie) return [];
      return [{ crewName: kerbal.name, tone: "warn" }];
    });
  },
});
