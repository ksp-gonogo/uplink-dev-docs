import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { Box, Text } from "@ksp-gonogo/ui-kit";
import { useEffect } from "react";

const uplink = defineUplinkClient({
  id: "dock-cam",
  version: "1.0.0",
  name: "Dock Cam",
});

const PICTURE_ASPECT = 16 / 9;

function DockCamera({
  reportPictureAspect,
}: SlotProps<"targeting.camera">) {
  useEffect(() => {
    reportPictureAspect(PICTURE_ASPECT);
    return () => reportPictureAspect(null);
  }, [reportPictureAspect]);
  return (
    <Box surface="sunken" pad="chip" style={{ position: "absolute", inset: 0 }}>
      <Text size="sm">Docking camera</Text>
    </Box>
  );
}

registerAugment({
  id: "dock-cam-backdrop",
  augments: "targeting.camera",
  component: DockCamera,
  owner: uplink,
});
