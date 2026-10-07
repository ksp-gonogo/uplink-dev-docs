import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `science.instruments` value every Experiments example draws, as the Gonogo mod sends it. */
export const scienceInstruments: WireOf<TopicPayload<"science.instruments">> = [
  {
    partId: "3960381880",
    partName: "Mk1 Command Pod",
    experimentId: "crewReport",
    deployed: true,
    inoperable: false,
    rerunnable: true,
    resettable: true,
    dataIsCollectable: true,
  },
  {
    partId: "342573834",
    partName: "PresMat Barometer",
    experimentId: "barometerScan",
    deployed: false,
    inoperable: false,
    rerunnable: true,
    resettable: true,
    dataIsCollectable: false,
  },
];
