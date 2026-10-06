import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `vessel.crew` value every Crew Status example draws, as the Gonogo mod sends it. */
export const vesselCrew: WireOf<TopicPayload<"vessel.crew">> = {
  count: 3,
  capacity: 4,
  crew: [
    { name: "Jebediah Kerman", trait: "Pilot", experienceLevel: 5 },
    { name: "Bill Kerman", trait: "Engineer", experienceLevel: 2 },
    { name: "Bob Kerman", trait: "Scientist", experienceLevel: 0 },
  ],
  meta: { source: "vessel:kerbal-x" },
};
