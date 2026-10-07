import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `comms.path` value every Comm Signal example draws: a vessel, one relay, then home. */
export const commsPath: WireOf<TopicPayload<"comms.path">> = {
  hops: [
    {
      from: "v1",
      to: "relay-mun",
      fromIsHome: false,
      toIsHome: false,
      kind: 1,
      distanceMeters: 11_400_000,
      strength: 0.35,
    },
    {
      from: "relay-mun",
      to: "KSC",
      fromIsHome: false,
      toIsHome: true,
      kind: 0,
      distanceMeters: 2_900_000,
      strength: 0.9,
    },
  ],
};
