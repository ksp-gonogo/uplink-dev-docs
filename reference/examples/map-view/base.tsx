import {
  defineUplinkClient,
  type MapCoverageGate,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { useEffect, useRef } from "react";

const uplink = defineUplinkClient({
  id: "survey-zones",
  version: "1.0.0",
  name: "Survey Zones",
  description: "Draws survey zones as the base layer of the Map View.",
});

const LAYER_ID = "survey-zones-tint";
/** Four cells to a degree, across the whole body. */
const WIDTH = 1440;
const HEIGHT = 720;

/** The regions this Uplink surveys on Kerbin, in degrees. */
const ZONES = [
  { west: -110, east: -40, south: -20, north: 20 },
  { west: 20, east: 80, south: 25, north: 55 },
];

/** Canvas x for a longitude: the left edge is -180 and the right 180. */
const xOf = (longitude: number) => ((longitude + 180) / 360) * WIDTH;
/** Canvas y for a latitude: the top edge is the north pole. */
const yOf = (latitude: number) => ((90 - latitude) / 180) * HEIGHT;

/** Keeps only what the coverage gate has revealed; with no coverage source, everything is. */
function keepRevealed(ctx: CanvasRenderingContext2D, gate: MapCoverageGate) {
  if (!gate.hasAnySource) return;
  if (!gate.data) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    return;
  }
  const mask = document.createElement("canvas");
  mask.width = gate.width;
  mask.height = gate.height;
  const pixels = new ImageData(gate.width, gate.height);
  gate.data.forEach((revealed, cell) => {
    pixels.data[cell * 4 + 3] = revealed;
  });
  mask.getContext("2d")?.putImageData(pixels, 0, 0);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, WIDTH, HEIGHT);
}

function SurveyZones({ bodyId, coverageGate, onLayer }: SlotProps<"map-view.base">) {
  const drawn = useRef(0);
  useEffect(() => {
    if (bodyId !== "Kerbin") return;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "rgba(90, 170, 255, 0.45)";
    for (const zone of ZONES) {
      ctx.fillRect(xOf(zone.west), yOf(zone.north), xOf(zone.east) - xOf(zone.west), yOf(zone.south) - yOf(zone.north));
    }
    keepRevealed(ctx, coverageGate);
    drawn.current += 1;
    onLayer(LAYER_ID, canvas, drawn.current);
    return () => onLayer(LAYER_ID, null, 0);
  }, [bodyId, coverageGate, onLayer]);
  return null;
}

registerAugment({
  id: LAYER_ID,
  augments: "map-view.base",
  component: SurveyZones,
  // A tint over the stock texture, which stays beneath it, so suppressesVanillaBase is left unset.
  owner: uplink,
});
