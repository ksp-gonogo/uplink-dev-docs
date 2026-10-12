import assert from "node:assert/strict";
import { test } from "node:test";
import { loadUplink } from "./load.ts";
import { resolveUplinkLink } from "./link.ts";
import { readSpec } from "./spec.ts";
import { withoutSaved, withSaved } from "./store.ts";

const minimal = {
  specVersion: 1,
  uplink: { id: "demo", name: "Demo", version: "1.0.0", description: "A demo.", wraps: null },
  topics: [{ id: "demo.t", payload: "P", array: false, fields: [{ name: "x", unit: "m" }], disposition: { delivery: "lossy-latest", delay: "delayed" } }],
  commands: [{ id: "demo.go", args: "GoArgs", result: "CommandResult" }],
  widgets: [{ id: "w", name: "W", description: "d", tags: [], channels: ["demo.t"], optionalChannels: [], commands: [], augmentSlots: [], contributionSlots: [], defaultSize: { w: 4, h: 3 }, minSize: null }],
};

test("a GitHub folder link becomes a jsDelivr base", () => {
  assert.deepEqual(resolveUplinkLink("https://github.com/o/r/tree/main/uplinks/demo/"), {
    base: "https://cdn.jsdelivr.net/gh/o/r@main/uplinks/demo",
    label: "o/r/uplinks/demo @ main",
  });
});

test("a released bundle's URL names its folder", () => {
  const link = resolveUplinkLink("https://cdn.jsdelivr.net/gh/o/r@releases/demo/1.0.0/demo.client.js");
  assert.deepEqual(link, { base: "https://cdn.jsdelivr.net/gh/o/r@releases/demo/1.0.0", label: "o/r/demo/1.0.0 @ releases" });
});

test("other hosts and non-links are refused with a sentence", () => {
  assert.match(String((resolveUplinkLink("https://example.com/x") as { error: string }).error), /Only github\.com/);
  assert.match(String((resolveUplinkLink("not a link") as { error: string }).error), /not a link/);
  assert.match(String((resolveUplinkLink("http://github.com/o/r/tree/m/x") as { error: string }).error), /https/);
});

test("a valid spec sheet reads, and one of another version is refused", () => {
  assert.equal(readSpec(minimal).topics[0].delivery, "lossy-latest");
  assert.throws(() => readSpec({ ...minimal, specVersion: 2 }), /version 2/);
  assert.throws(() => readSpec({ ...minimal, uplink: { ...minimal.uplink, name: 5 } }), /uplink\.name is not text/);
});

test("markup in a value stays text and unknown fields are dropped", () => {
  const spec = readSpec({ ...minimal, uplink: { ...minimal.uplink, description: "<img src=x onerror=alert(1)>" }, extra: "<script>" });
  assert.equal(spec.uplink.description, "<img src=x onerror=alert(1)>");
  assert.equal("extra" in spec, false);
});

test("loading tries a release folder then a source folder, and lists committed pictures", async () => {
  const served = new Map<string, unknown>([
    ["https://h/b/client/docs/spec.json", minimal],
    ["https://h/b/client/gonogo-uplink.json", { contractMajor: 40, contractMinor: 0, apiVersion: "3.0", version: "1.0.0" }],
    ["https://h/b/client/docs/assets/render-shape.json", { assets: { "w--default.png": {}, "../evil.png": {} } }],
  ]);
  const fetcher = async (url: string) =>
    served.has(url) ? new Response(JSON.stringify(served.get(url))) : new Response("no", { status: 404 });
  const loaded = await loadUplink("https://h/b", fetcher);
  assert.equal(loaded.spec.uplink.id, "demo");
  assert.equal(loaded.manifest?.contractMajor, 40);
  assert.deepEqual(loaded.pictures.map((p) => p.name), ["w--default.png"]);
});

test("a folder with no spec sheet says how to make one", async () => {
  await assert.rejects(loadUplink("https://h/none", async () => new Response("no", { status: 404 })), /uplink-tools page/);
});

test("the saved list adds once and removes by base", () => {
  const a = { base: "a", label: "A" };
  assert.deepEqual(withSaved(withSaved([], a), a), [a]);
  assert.deepEqual(withoutSaved([a], "a"), []);
});
