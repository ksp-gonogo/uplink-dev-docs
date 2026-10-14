// npm install @ksp-gonogo/sitrep-sdk
import { defineUplinkClient, observedValue } from "@ksp-gonogo/sitrep-sdk";

// In an Uplink this call is `src/uplink.ts`, which exports `uplink`; its `id` is the id its C# half, the Uplink's plugin, declares.
const uplink = defineUplinkClient({
  id: "linkbudget",
  version: "1.0.0",
  name: "Link Budget",
  description: "Gives each hop on the comms route a data rate from how strong its link is.",
});

/**
 * The rate of a hop at full strength, in bits per second. This example has no comms mod of its own, so it models a rate from the hop's strength with a made-up figure; an Uplink for a mod that models bitrate reads its rates from a Topic that Uplink publishes.
 */
const FULL_STRENGTH_BITS_PER_SEC = 2_000_000;

uplink.registerContribution({
  id: "hop-rates",
  contributes: "comm-signal.hop-rates",
  deps: ["comms.path"],
  compute: (topics) => {
    // observedValue returns the Topic's value only while its reading is current. A hop's strength is a model's figure, not a fact, so a held path (the last one received, no longer updating) draws no rate.
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
