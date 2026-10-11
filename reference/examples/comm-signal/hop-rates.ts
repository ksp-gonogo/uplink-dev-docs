import { defineUplinkClient, stillTrue } from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "linkbudget",
  version: "1.0.0",
  name: "Link Budget",
  description: "Gives each hop on the comms route a data rate from how strong its link is.",
});

/** The rate of a hop at full strength, in bits per second. */
const FULL_STRENGTH_BITS_PER_SEC = 2_000_000;

uplink.registerContribution({
  id: "hop-rates",
  contributes: "comm-signal.hop-rates",
  deps: ["comms.path"],
  compute: (topics) => {
    const path = stillTrue(topics["comms.path"], undefined);
    if (!path) return null;
    return path.hops.flatMap((hop) =>
      hop.strength
        ? [
            {
              fromNodeId: hop.from,
              toNodeId: hop.to,
              bitsPerSec: hop.strength.magnitude * FULL_STRENGTH_BITS_PER_SEC,
              held: topics["comms.path"],
            },
          ]
        : [],
    );
  },
});
