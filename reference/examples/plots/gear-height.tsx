// npm install @ksp-gonogo/sitrep-sdk
import { defineUplinkClient, type PlotEntry } from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "gearguide",
  version: "1.0.0",
  name: "Gear Guide",
  description: "Draws the height at which landing gear should be down on a plot.",
});

// The landing status widget draws the "landing-cross-section" plot with its own frame, so this entry names the subject
// and supplies no frame: its layer is added to that plot and measured on that plot's axes, whose vertical axis is height in metres.
// Name a subject nothing draws, or leave the frame out for your own plot, and the layer is not shown and nothing reports it.
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
