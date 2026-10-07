import {
  defineUplinkClient,
  type SpaceCenterFacilityEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "pad-expansion",
  version: "1.0.0",
  name: "Pad Expansion",
});

uplink.registerContribution({
  id: "four-tier-pad",
  contributes: "space-center-status.facilities",
  deps: [],
  compute: (): SpaceCenterFacilityEntry[] => [
    {
      facility: "LaunchPad",
      currentTier: 2,
      maxTier: 3,
      upgradeCost: 420000,
      currentTierText: "* Max vessel mass: 450 t\n* Max part count: 255",
      nextTierText: "* Max vessel mass: 900 t\n* Max part count: 600",
    },
  ],
});
