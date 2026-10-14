// npm install @ksp-gonogo/sitrep-sdk
import {
  defineUplinkClient,
  observedValue,
  type PlotEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "descentcorridor",
  version: "1.0.0",
  name: "Descent Corridor",
  description: "Draws the corridor of descent speeds a lander can still stop from.",
});

// The plot draws only the last 400 m of the descent, in metres.
const CEILING = 400;
// The deceleration the lander is assumed to hold, in m/s squared, which sets the speed it can still stop from at each height.
const BRAKING = 2;

uplink.registerContribution({
  id: "descentcorridor-plot",
  contributes: "plots",
  deps: ["vessel.flight"],
  compute: (topics): PlotEntry[] | null => {
    const flight = observedValue(topics["vessel.flight"]);
    const height = flight?.altitudeTerrain?.magnitude;
    const climb = flight?.verticalSpeed?.magnitude;
    if (height === undefined || climb === undefined || height > CEILING) return null;
    const limit = (h: number) => Math.sqrt(2 * BRAKING * h);
    const heights = Array.from({ length: 21 }, (_, i) => (CEILING * i) / 20);
    return [
      {
        // This plot is this Uplink's own, so a plain string names its subject; one that other Uplinks add layers to is declared in PlotSubjectRegistry.
        subject: "descentcorridor",
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
            // Placed against the frame's 50 m/s: a faster descent is outside it, where the marker is clipped.
            at: { x: -climb, y: height },
            tone: "info",
            label: "You",
          },
        ],
      },
    ];
  },
});
