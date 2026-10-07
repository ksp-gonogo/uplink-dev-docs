import { type TimelinePoint, value } from "@ksp-gonogo/sitrep-sdk";
import { describe, expect, it } from "vitest";
import type { ExampleHeartbeat } from "./__generated__/contract.js";
import { reckonTicks } from "./reckoner.js";

const sample = (validAt: number, ticks: number) =>
  ({
    validAt,
    payload: { ut: value("ut", validAt), ticks: value("count", ticks) },
    meta: {},
    epoch: 0,
  }) as TimelinePoint<ExampleHeartbeat>;

describe("reckonTicks", () => {
  it("carries the count forward at the rate the samples advanced it", () => {
    const history = [sample(100, 10), sample(110, 20)];
    const model = reckonTicks(history[1], history, 115);

    if ("declined" in model) throw new Error(model.declined.reason);
    expect(model.reckon(115).ticks?.magnitude).toBe(25);
  });

  it("declines with one sample, since one sample has no rate", () => {
    const only = sample(100, 10);

    expect(reckonTicks(only, [only], 105)).toEqual({ declined: { reason: "insufficient-history" } });
  });

  it("declines after a reset, rather than counting down", () => {
    const history = [sample(100, 10), sample(110, 1)];

    expect(reckonTicks(history[1], history, 115)).toMatchObject({ declined: { reason: "model-inapplicable" } });
  });

  it("declines past two minutes from the last sample", () => {
    const history = [sample(100, 10), sample(110, 20)];

    expect(reckonTicks(history[1], history, 300)).toEqual({ declined: { reason: "beyond-horizon" } });
  });
});
