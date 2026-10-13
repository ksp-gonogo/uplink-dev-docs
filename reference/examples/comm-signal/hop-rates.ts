import { defineUplinkClient, observedValue } from "@ksp-gonogo/sitrep-sdk";

// In an Uplink this call is `src/uplink.ts`, which exports `uplink`; its `id` is the plugin's own.
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
    // A hop's strength is a model's figure, not a fact, so a held path draws no rate.
    const path = observedValue(topics["comms.path"]);
    if (!path) return null;
    return path.hops.flatMap((hop) =>
      hop.strength
        ? [
            {
              fromNodeId: hop.from,
              toNodeId: hop.to,
              bitsPerSec: hop.strength.magnitude * FULL_STRENGTH_BITS_PER_SEC,
            },
          ]
        : [],
    );
  },
});
