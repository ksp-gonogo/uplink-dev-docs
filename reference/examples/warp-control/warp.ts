import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `time.warp` value every Warp Control example reads, as the Gonogo mod sends it: on-rails warp at 1000x. */
export const timeWarp: WireOf<TopicPayload<"time.warp">> = {
  warpRate: 1000,
  warpRateIndex: 5,
  warpMode: 0,
  paused: false,
  warpRates: [1, 5, 10, 50, 100, 1000, 10000, 100000],
  keyframeFloorSec: 0,
  sampleIntervalUt: 1,
  meta: { source: "game" },
};
