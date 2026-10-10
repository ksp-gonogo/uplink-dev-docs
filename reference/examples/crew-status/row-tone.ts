import {
  type CrewRowToneEntry,
  defineUplinkClient,
  stillTrue,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crew-rookies",
  version: "1.0.0",
  name: "Crew Rookies",
  description: "Tints the rows of rookie kerbals in Crew Status.",
});

uplink.registerContribution({
  id: "rookie-rows",
  contributes: "crew-status.row-tone",
  deps: ["vessel.crew"],
  compute: (topics): CrewRowToneEntry[] => {
    const crew = stillTrue(topics["vessel.crew"], undefined)?.crew ?? [];
    return crew.flatMap((kerbal) => {
      const rookie = kerbal.experienceLevel?.isZero() === true;
      if (!kerbal.name || !rookie) return [];
      return [{ crewName: kerbal.name, tone: "warn" }];
    });
  },
});
