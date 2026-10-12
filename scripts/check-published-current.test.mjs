import assert from "node:assert/strict";
import { test } from "node:test";
import { staleness } from "./check-published-current.mjs";

const all = (v) => ({ "@ksp-gonogo/sitrep-sdk": v, "@ksp-gonogo/ui-kit": v, "@ksp-gonogo/uplink-tools": v });

test("a version every package's tag holds is current", () => {
  assert.deepEqual(staleness("1.0.0-rc.32", "rc", all("1.0.0-rc.32")), []);
});

test("a newer candidate, or a package with no tag, is named (planted: the check must see it)", () => {
  const found = staleness("1.0.0-rc.27", "rc", { ...all("1.0.0-rc.32"), "@ksp-gonogo/ui-kit": "" });
  assert.equal(found.length, 3);
  assert.match(found[0], /rc\.32/);
  assert.match(found[1], /not published/);
});
