import assert from "node:assert/strict";
import test from "node:test";
import { decide, isStale } from "./decide-channels.mjs";

test("main builds both channels, any other branch only the root", () => {
  assert.deepEqual(decide("refs/heads/main"), ["latest", "rc"]);
  assert.deepEqual(decide("refs/heads/topic"), ["latest"]);
});

test("a channel is stale when it was never deployed or names another version or commit", () => {
  const now = { version: "1.0.0", commit: "a" };
  assert.equal(isStale(now, undefined), true);
  assert.equal(isStale(now, { version: "1.0.0-rc.4", commit: "a" }), true);
  assert.equal(isStale(now, { version: "1.0.0", commit: "b" }), true);
  assert.equal(isStale(now, { version: "1.0.0", commit: "a" }), false);
});
