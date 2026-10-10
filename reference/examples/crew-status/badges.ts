import {
  type BadgeEntry,
  defineUplinkClient,
  stillTrue,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crewfreeseats",
  version: "1.0.0",
  name: "Crew Free Seats",
  description: "Badges Crew Status with the number of free seats.",
});

uplink.registerContribution({
  id: "free-seats",
  contributes: "crew-status.badges",
  deps: ["vessel.crew"],
  compute: (topics): BadgeEntry[] | null => {
    const crew = stillTrue(topics["vessel.crew"], undefined);
    if (!crew) return null;
    const free = crew.capacity.magnitude - crew.count.magnitude;
    return [{ id: "free-seats", label: `Seats free: ${free}`, tone: "info" }];
  },
});
