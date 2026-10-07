import { type ExampleHeartbeat } from "./__generated__/contract.js";
import { type ReckonerAnswer, type TimelinePoint, value } from "@ksp-gonogo/sitrep-sdk";
import { EXAMPLE } from "./uplink.js";

/** How far back the count's rate is measured, and how far past the last sample it is carried, in game seconds. */
const SPAN_UT = 120;

/** The count in a sample, or null when the sample has none. */
const ticksOf = (point: TimelinePoint<ExampleHeartbeat>) => point.payload?.ticks?.magnitude ?? null;

// #region reckon
/**
 * Carries the heartbeat forward between samples: its time to the instant
 * asked for, and its count at the rate the samples in the last two minutes
 * advanced it.
 */
export function reckonTicks(
  point: TimelinePoint<ExampleHeartbeat>,
  history: readonly TimelinePoint<ExampleHeartbeat>[],
  reckonUt: number,
): ReckonerAnswer<ExampleHeartbeat> {
  const first = history[0];
  const last = ticksOf(point);
  const start = first ? ticksOf(first) : null;
  if (!first || last === null || start === null || point.validAt <= first.validAt) {
    return { declined: { reason: "insufficient-history" } };
  }
  const perSecond = (last - start) / (point.validAt - first.validAt);
  // A count that went down was reset, and its rate says nothing about what comes next.
  if (perSecond < 0) {
    return { declined: { reason: "model-inapplicable", note: "The count was reset" } };
  }
  if (reckonUt - point.validAt > SPAN_UT) {
    return { declined: { reason: "beyond-horizon" } };
  }
  // The whole heartbeat moves: the sample it projects is the one the plugin would send at viewUt.
  return {
    modelled: [{ path: "", basis: "rate-integration" }],
    reckon: (viewUt) => ({
      ut: value("ut", viewUt),
      ticks: value("count", Math.floor(last + perSecond * (viewUt - point.validAt))),
    }),
  };
}
// #endregion reckon

// #region register
EXAMPLE.registerReckoner("example.heartbeat", {
  deps: [],
  window: { spanUt: SPAN_UT, maxSamples: 30, minSamples: 2 },
  reckon: (point, _deps, frame) => reckonTicks(point, frame.history, frame.reckonUt),
});
// #endregion register
