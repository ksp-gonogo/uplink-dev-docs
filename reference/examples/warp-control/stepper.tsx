import {
  defineUplinkClient,
  registerAugment,
  useCommand,
  useTelemetry,
  WarpMode,
} from "@ksp-gonogo/sitrep-sdk";
import { Button } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "warp-cruise",
  version: "1.0.0",
  name: "Warp Cruise",
});

const CRUISE_RATE = 100;

function CruiseButton() {
  const warp = useTelemetry("time.warp");
  const setWarpIndex = useCommand("time.setWarpIndex");
  if (warp.state !== "observed") return null;
  const index = warp.value.warpRates?.findIndex((rate) => rate.equals(CRUISE_RATE));
  if (index === undefined || index < 0) return null;
  // The rate index counts on-rails rungs only under on-rails warp.
  const cruising = warp.value.warpMode === WarpMode.High && warp.value.warpRateIndex === index;
  return (
    <Button
      disabled={cruising}
      onClick={() => void setWarpIndex.send({ index })}
    >
      Cruise at {CRUISE_RATE}x
    </Button>
  );
}

registerAugment({
  id: "warp-cruise-button",
  augments: "warp-control.stepper",
  component: CruiseButton,
  channels: ["time.warp"],
  owner: uplink,
});
