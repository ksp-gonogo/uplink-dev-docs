import {
  defineUplinkClient,
  type SystemViewVesselStatusEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "checkinwatch",
  version: "1.0.0",
  name: "Check-in Watch",
  description: "Flags a vessel on the System View when its check-in is overdue.",
});

uplink.registerContribution({
  id: "overdue-check-in",
  contributes: "system-view.vessel-status",
  deps: ["vessel.identity"],
  compute: (topics): SystemViewVesselStatusEntry[] => {
    const identity = topics["vessel.identity"];
    if (identity.state !== "held") return [];
    return [
      {
        target: identity.value.vesselId,
        tone: "warn",
        emphasis: "reckoned",
        label: "Check-in overdue",
      },
    ];
  },
});
