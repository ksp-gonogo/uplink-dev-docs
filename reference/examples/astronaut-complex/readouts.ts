import {
  defineUplinkClient,
  observedValue,
  type StatEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crew-seats",
  version: "1.0.0",
  name: "Crew Seats",
  description: "Adds a free seats readout to the Astronaut Complex.",
});

uplink.registerContribution({
  id: "free-seats",
  contributes: "astronaut-complex.readouts",
  deps: ["spaceCenter.astronautComplex"],
  compute: (topics): StatEntry[] => {
    const complex = observedValue(topics["spaceCenter.astronautComplex"]);
    if (!complex?.activeCrew || !complex.crewCapacity) return [];
    const free = complex.crewCapacity.magnitude - complex.activeCrew.magnitude;
    return [
      {
        id: "free-seats",
        label: "Free seats",
        text: String(free),
        detail: `${complex.applicants.length} applicants waiting`,
      },
    ];
  },
});
