import {
  type BadgeEntry,
  defineUplinkClient,
  stillTrue,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "crew-capacity",
  version: "1.0.0",
  name: "Crew Capacity",
  description: "Badges the Crew Status header when the cabin is full.",
});

uplink.registerContribution({
  id: "full-cabin",
  contributes: "crew-status.badges",
  deps: ["vessel.crew"],
  compute: (topics): BadgeEntry[] | null => {
    const crew = stillTrue(topics["vessel.crew"], undefined);
    if (!crew || crew.count.lessThan(crew.capacity)) return null;
    return [{ id: "full-cabin", label: "Cabin full", tone: "warn" }];
  },
});
