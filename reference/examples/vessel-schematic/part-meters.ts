import {
  defineUplinkClient,
  observedValue,
  type VesselSchematicPartMeterEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "oremeters",
  version: "1.0.0",
  name: "Ore Meters",
  description: "Adds an ore level meter to each tank on the Vessel Schematic.",
});

const LOW_ORE = 0.25;

uplink.registerContribution({
  id: "ore-level",
  contributes: "vessel-schematic.part-meters",
  deps: ["vessel.parts"],
  compute: (topics): VesselSchematicPartMeterEntry[] => {
    const parts = observedValue(topics["vessel.parts"])?.parts ?? [];
    return parts.flatMap((part) => {
      const ore = part.resources.Ore;
      // An amount or capacity that is absent is not zero, so such a tank gets no meter.
      if (!ore?.amount || !ore.maxAmount) return [];
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
