import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `spaceCenter.astronautComplex` value every Astronaut Complex example draws, as the Gonogo mod sends it. */
export const astronautComplex: WireOf<
  TopicPayload<"spaceCenter.astronautComplex">
> = {
  applicants: [
    {
      name: "Desdin Kerman",
      trait: "Scientist",
      experienceLevel: 0,
      courage: 0.65,
      stupidity: 0.2,
    },
    {
      name: "Limmy Kerman",
      trait: "Pilot",
      experienceLevel: 0,
      courage: 0.4,
      stupidity: 0.55,
    },
    {
      name: "Nelemy Kerman",
      trait: "Engineer",
      experienceLevel: 0,
      courage: 0.8,
      stupidity: 0.15,
    },
  ],
  activeCrew: 4,
  crewCapacity: 13,
  nextHireCost: 24000,
};
