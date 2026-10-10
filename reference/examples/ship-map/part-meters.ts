import {
  defineUplinkClient,
  observedValue,
  type ShipMapPartMeterEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "oremeters",
  version: "1.0.0",
  name: "Ore Meters",
  description: "Adds an ore level meter to each tank on the Ship Map.",
});

const LOW_ORE = 0.25;

uplink.registerContribution({
  id: "ore-level",
  contributes: "ship-map.part-meters",
  deps: ["vessel.parts"],
  compute: (topics): ShipMapPartMeterEntry[] => {
    const parts = observedValue(topics["vessel.parts"])?.parts ?? [];
    return parts.flatMap((part) => {
      const ore = part.resources.Ore;
      if (!ore) return [];
      const low = ore.amount.lessThan(ore.maxAmount.scaled(LOW_ORE));
      return [
        {
          // A part's id is its flightID as a string, which is what ties the entry to the part.
          partId: part.id,
          resource: "Ore",
          displayName: "Ore",
          amount: ore.amount,
          capacity: ore.maxAmount,
          status: low ? "low" : null,
        },
      ];
    });
  },
});
