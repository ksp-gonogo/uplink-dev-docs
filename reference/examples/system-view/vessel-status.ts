import {
  defineUplinkClient,
  stillTrue,
  type SystemViewVesselStatusEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "check-in-watch",
  version: "1.0.0",
  name: "Check-in Watch",
  description: "Reference example: Check-in Watch.",
});

uplink.registerContribution({
  id: "overdue-check-in",
  contributes: "system-view.vessel-status",
  deps: ["vessel.identity"],
  compute: (topics): SystemViewVesselStatusEntry[] => {
    const vessel = stillTrue(topics["vessel.identity"], undefined);
    if (!vessel) return [];
    return [
      {
        target: vessel.vesselId,
        tone: "warn",
        emphasis: "reckoned",
        label: "Check-in overdue",
      },
    ];
  },
});
