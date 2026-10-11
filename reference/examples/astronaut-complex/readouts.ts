import {
  defineUplinkClient,
  observedValue,
  type StatEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crewseats",
  version: "1.0.0",
  name: "Crew Seats",
  description: "Adds a free seats readout to the Astronaut Complex.",
});

/** The cap at the top facility tier, which the contract sends unclamped. */
const UNLIMITED = 2_147_483_647;

uplink.registerContribution({
  id: "free-seats",
  contributes: "astronaut-complex.readouts",
  deps: ["spaceCenter.astronautComplex"],
  compute: (topics): StatEntry[] | null => {
    const complex = observedValue(topics["spaceCenter.astronautComplex"]);
    if (!complex?.activeCrew || !complex.crewCapacity) return null;
    if (complex.crewCapacity.magnitude >= UNLIMITED) return null;
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
