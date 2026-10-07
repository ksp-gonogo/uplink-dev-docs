import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { useEffect } from "react";

const uplink = defineUplinkClient({
  id: "map-graticule",
  version: "1.0.0",
  name: "Map Graticule",
});

const WIDTH = 1024;
const HEIGHT = 512;
const LAYER_ID = "map-graticule-grid";

function Graticule({ onLayer }: SlotProps<"map-view.base">) {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    for (let lon = 0; lon <= 360; lon += 30) {
      const x = (lon / 360) * WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let lat = 0; lat <= 180; lat += 30) {
      const y = (lat / 180) * HEIGHT;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }
    onLayer(LAYER_ID, canvas, 1);
    return () => onLayer(LAYER_ID, null, 0);
  }, [onLayer]);
  return null;
}

registerAugment({
  id: "map-graticule-grid",
  augments: "map-view.base",
  component: Graticule,
  owner: uplink,
});
