import { defineUplinkClient } from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "science-terms",
  version: "1.0.0",
  name: "Science Terms",
  description: "Adds a one-press filter for results from a mod's experiments to the Experiments list.",
});

uplink.registerContribution({
  id: "seismic-term",
  contributes: "experiments.filters",
  deps: [],
  compute: () => ["seismic"],
});

declare module "@ksp-gonogo/sitrep-sdk" {
  interface ComponentSlotRegistry {
    /** Search terms for a widget of your own that draws a FilterList with `segment="my-terms"`. */
    "my-terms": string;
  }
}
