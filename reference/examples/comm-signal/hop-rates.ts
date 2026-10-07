import {
  type CommSignalHopRateEntry,
  defineUplinkClient,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "link-budget",
  version: "1.0.0",
  name: "Link Budget",
});

const FULL_STRENGTH_BITS_PER_SEC = 2_000_000;

uplink.registerContribution({
  id: "hop-bitrates",
  contributes: "comm-signal.hop-rates",
  deps: ["comms.path"],
  compute: (topics): CommSignalHopRateEntry[] => {
    const hops = topics["comms.path"]?.hops ?? [];
    return hops.flatMap((hop) => {
      if (!hop.strength) return [];
      return [
        {
          fromNodeId: hop.from,
          toNodeId: hop.to,
          bitsPerSec: FULL_STRENGTH_BITS_PER_SEC * hop.strength.magnitude,
        },
      ];
    });
  },
});
