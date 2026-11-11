import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { useEffect } from "react";

const uplink = defineUplinkClient({
  id: "dockview",
  version: "1.0.0",
  name: "Dock View",
  description: "Paints a camera picture behind the Rendezvous docking view.",
});

const WIDTH = 1600;
const HEIGHT = 900;
const VFOV_DEG = 60;

// A fixed 16:9 frame stands in for the picture here. An Uplink that serves camera
// pictures draws the picture of the part named by `cameraFlightId` instead, and
// picks a camera of its own when that is null.
const FRAME = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="#10202c"/><circle cx="${WIDTH / 2}" cy="${HEIGHT / 2}" r="260" fill="#1b3a4e"/></svg>`,
)}`;

function DockingPicture({ reportPicture }: SlotProps<"rendezvous.camera">) {
  // The reticle is projected through the picture's field of view, so report the
  // picture's size and field, and report null once it is gone.
  useEffect(() => {
    reportPicture({ frameWidth: WIDTH, frameHeight: HEIGHT, vfovDeg: VFOV_DEG });
    return () => reportPicture(null);
  }, [reportPicture]);
  return (
    <img
      src={FRAME}
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

registerAugment({
  id: "dockview-picture",
  augments: "rendezvous.camera",
  component: DockingPicture,
  owner: uplink,
});
