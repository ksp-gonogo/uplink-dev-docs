import {
  defineUplinkClient,
  stillTrue,
  type SystemEntity,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "relayring",
  version: "1.0.0",
  name: "Relay Ring",
  description: "Draws a ring of relay satellites around Kerbin on the System View.",
});

const SYNCHRONOUS_SMA = 3_463_330;
const RELAYS = 3;

uplink.registerContribution({
  id: "kerbin-relays",
  contributes: "system-view.entities",
  deps: ["system.bodies"],
  compute: (topics): SystemEntity[] => {
    const hasKerbin = stillTrue(topics["system.bodies"], undefined)?.bodies.some(
      (body) => body.name === "Kerbin",
    );
    if (!hasKerbin) return [];
    const orbit = {
      kind: "orbit" as const,
      parentName: "Kerbin",
      sma: SYNCHRONOUS_SMA,
      ecc: 0,
      lan: 0,
      argPe: 0,
      inclination: 0,
    };
    const ring: SystemEntity = {
      id: "relay-ring:orbit",
      position: orbit,
      shape: { kind: "orbit-path" },
      style: { tone: "info" },
    };
    const relays = Array.from({ length: RELAYS }, (_, i): SystemEntity => ({
      id: `relay-ring:relay-${i + 1}`,
      position: { ...orbit, epoch: 0, meanAnomalyAtEpoch: (2 * Math.PI * i) / RELAYS },
      shape: { kind: "point", radiusPx: 5 },
      style: { tone: "info" },
      meta: { Relay: `Relay ${i + 1}` },
    }));
    return [ring, ...relays];
  },
});
