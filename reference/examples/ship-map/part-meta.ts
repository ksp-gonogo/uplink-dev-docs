import {
  defineUplinkClient,
  observedValue,
  type ShipMapPartMetaEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "engine-status",
  version: "1.0.0",
  name: "Engine Status",
  description: "Marks an engine part on the Ship Map when it has flamed out.",
});

uplink.registerContribution({
  id: "engine-flameout",
  contributes: "ship-map.part-meta",
  deps: ["vessel.parts"],
  compute: (topics): ShipMapPartMetaEntry[] => {
    const parts = observedValue(topics["vessel.parts"])?.parts ?? [];
    return parts.flatMap((part) => {
      const engine = part.moduleStates.find((module) => module.type === "engine");
      if (!engine) return [];
      const flameout = engine.flameout === true;
      return [
        {
          partId: part.id,
          label: "Engine",
          kind: "text",
          text: flameout ? "Flamed out" : "Burning",
          // Every entry names a tone, but only a "ratio" row draws it, as its meter's colour; a text row is drawn plain.
          tone: flameout ? "nogo" : "go",
        },
      ];
    });
  },
});
