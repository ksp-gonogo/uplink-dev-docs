import { type BadgeEntry, defineUplinkClient } from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crew-free-seats",
  version: "1.0.0",
  name: "Crew Free Seats",
  description: "Reference example: Crew Free Seats.",
});

uplink.registerContribution({
  id: "free-seats",
  contributes: "crew-status.badges",
  deps: ["vessel.crew"],
  compute: (topics): BadgeEntry[] | null => {
    const crew = topics["vessel.crew"];
    if (!crew) return null;
    const free = crew.capacity.magnitude - crew.count.magnitude;
    return [{ id: "free-seats", label: `Seats free: ${free}`, tone: "info" }];
  },
});
