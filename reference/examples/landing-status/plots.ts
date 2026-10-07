import { defineUplinkClient, type PlotEntry } from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "descent-corridor",
  version: "1.0.0",
  name: "Descent Corridor",
});

const CEILING = 400;
const BRAKING = 2;

uplink.registerContribution({
  id: "descent-corridor-plot",
  contributes: "plots",
  deps: ["vessel.flight"],
  compute: (topics): PlotEntry[] => {
    const flight = topics["vessel.flight"];
    const height = flight?.altitudeTerrain?.magnitude;
    const climb = flight?.verticalSpeed?.magnitude;
    if (height === undefined || climb === undefined || height > CEILING) return [];
    const limit = (h: number) => Math.sqrt(2 * BRAKING * h);
    const heights = Array.from({ length: 21 }, (_, i) => (CEILING * i) / 20);
    return [
      {
        subject: "descent-corridor",
        title: "Descent corridor",
        frame: { xDomain: [0, 50], yDomain: [0, CEILING], xUnit: "m/s", yUnit: "m" },
        layers: [
          {
            id: "limit",
            kind: "region",
            boundary: heights.map((y) => ({ x: limit(y), y })),
            side: "right",
            tone: "warn",
            label: "Too fast to stop",
          },
          {
            id: "you",
            kind: "marker",
            at: { x: -climb, y: height },
            tone: "info",
            label: "You",
          },
        ],
      },
    ];
  },
});
