import {
  defineUplinkClient,
  registerAugment,
  useCommand,
  useTelemetry,
  value,
  WarpMode,
} from "@ksp-gonogo/sitrep-sdk";
import { Button } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "warpcruise",
  version: "1.0.0",
  name: "Warp Cruise",
  description: "Adds a button to the Warp Control stepper that warps to cruise speed.",
});

const CRUISE_RATE = 100;
// The widget's own buttons need an alarm set above this one-way delay.
const ALARM_REQUIRED_ABOVE = value("s", 5);

function CruiseButton() {
  const warp = useTelemetry("time.warp");
  const delay = useTelemetry("comms.delay");
  const setWarpIndex = useCommand("time.setWarpIndex");
  if (warp.state !== "observed") return null;
  const index = warp.value.warpRates?.findIndex((rate) => rate.equals(CRUISE_RATE));
  if (index === undefined || index < 0) return null;
  // Unknown delay is not long delay; no path home is the far end of it.
  const oneWay = delay.state === "observed" ? delay.value.oneWaySeconds : undefined;
  const needsAlarm =
    oneWay === null || (oneWay !== undefined && oneWay.greaterThan(ALARM_REQUIRED_ABOVE));
  const current = warp.value.warpRateIndex;
  // The rate index counts on-rails rungs only under on-rails warp.
  const cruising = warp.value.warpMode === WarpMode.High && warp.value.warpRateIndex === index;
  return (
    <Button
      disabled={cruising || (needsAlarm && index > current)}
      onClick={() => void setWarpIndex.send({ index })}
    >
      Cruise at {CRUISE_RATE}x
    </Button>
  );
}

registerAugment({
  id: "warpcruise-button",
  augments: "warp-control.stepper",
  component: CruiseButton,
  channels: ["time.warp", "comms.delay"],
  owner: uplink,
});
