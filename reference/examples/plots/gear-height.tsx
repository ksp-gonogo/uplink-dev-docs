import { defineUplinkClient, type PlotEntry } from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "gear-guide",
  version: "1.0.0",
  name: "Gear Guide",
});

const gearHeight: PlotEntry = {
  subject: "landing-cross-section",
  layers: [
    {
      id: "gear-height",
      kind: "rule",
      along: "y",
      value: 100,
      label: "Gear down",
      tone: "caution",
      description: "Gear is lowered at 100 metres",
    },
  ],
};

uplink.registerContribution({
  id: "gear-height",
  contributes: "plots",
  compute: () => [gearHeight],
});
