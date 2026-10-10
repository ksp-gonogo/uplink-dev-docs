import {
  defineUplinkClient,
  type ExperimentsInstrumentEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "seismicpods",
  version: "1.0.0",
  name: "Seismic Pods",
  description: "Lists seismic pods, with their stored results, among the Experiments instruments.",
});

const storedResults = uplink.registerProcessor({
  id: "stored-results",
  deps: [{ reading: "science.experiments" }] as const,
  compute: ([results]) =>
    results.state === "observed" || results.state === "held"
      ? results.value.length
      : 0,
});

uplink.registerContribution({
  id: "seismic-pod",
  contributes: "experiments.instruments",
  deps: [storedResults],
  compute: (topics): ExperimentsInstrumentEntry[] => {
    const stored = topics[storedResults.id];
    if (!stored) return [];
    const holdsData = (stored.value ?? 0) > 0;
    return [
      {
        partId: "seismic-pod-1",
        partTitle: "Seismic Pod",
        expId: "seismicScan",
        deployed: true,
        hasData: holdsData,
        rerunnable: true,
        inoperable: false,
        reading: stored,
      },
    ];
  },
});
