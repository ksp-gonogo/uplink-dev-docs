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
  description: "Paints a camera picture behind the Targeting docking view.",
});

const WIDTH = 1600;
const HEIGHT = 900;

// A fixed 16:9 frame. An Uplink that serves camera pictures draws the picture
// of the part named by `cameraFlightId` here, and picks a camera of its own when
// that is null.
const FRAME = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="#10202c"/><circle cx="${WIDTH / 2}" cy="${HEIGHT / 2}" r="260" fill="#1b3a4e"/></svg>`,
)}`;

function DockingPicture({ reportPictureAspect }: SlotProps<"targeting.camera">) {
  // The reticle's degree scale follows the visible field of the picture, so say
  // what its shape is, and say it is gone when the picture is.
  useEffect(() => {
    reportPictureAspect(WIDTH / HEIGHT);
    return () => reportPictureAspect(null);
  }, [reportPictureAspect]);
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
  augments: "targeting.camera",
  component: DockingPicture,
  owner: uplink,
});
