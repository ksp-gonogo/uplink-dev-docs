import { type BadgeEntry, defineUplinkClient } from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crew-capacity",
  version: "1.0.0",
  name: "Crew Capacity",
});

uplink.registerContribution({
  id: "full-cabin",
  contributes: "crew-status.badges",
  deps: ["vessel.crew"],
  compute: (topics): BadgeEntry[] | null => {
    const crew = topics["vessel.crew"];
    if (!crew || crew.count.lessThan(crew.capacity)) return null;
    return [{ id: "full-cabin", label: "Cabin full", tone: "warn" }];
  },
});
