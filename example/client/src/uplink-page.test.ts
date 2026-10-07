import { expectUplinkPageCurrent } from "@ksp-gonogo/uplink-tools/page-check";
import { describe, it } from "vitest";
import "./index.js";

describe("the generated Uplink page", () => {
  it("still describes what this Uplink registers", () => {
    expectUplinkPageCurrent();
  });
});
