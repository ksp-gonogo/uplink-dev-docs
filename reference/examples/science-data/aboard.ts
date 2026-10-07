import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `science.experimentBreakdown` value every Science Data example draws: what the vessel holds for each subject on the Mun. */
export const experimentBreakdown: WireOf<
  TopicPayload<"science.experimentBreakdown">
> = [
  {
    subjectId: "crewReport@MunSrfLandedMidlandCraters",
    biome: "Midland Craters",
    situation: "SrfLanded",
    expTitle: "Crew Report from Midland Craters",
    dataMits: 6,
    remainingPotential: 2.4,
  },
  {
    subjectId: "mysteryGoo@MunSrfLandedMidlandCraters",
    biome: "Midland Craters",
    situation: "SrfLanded",
    expTitle: "Mystery Goo Observation from Midland Craters",
    dataMits: 3.5,
    remainingPotential: 5.1,
  },
];
