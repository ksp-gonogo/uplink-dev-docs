import assert from "node:assert/strict";
import { test } from "node:test";
import { loadUplink } from "./load.ts";
import { resolveUplinkLink } from "./link.ts";
import { renderMarkdown, withoutHtmlComments } from "./markdown.ts";
import { parseRoute, routeHash } from "./route.ts";
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

test("a folder served from this machine is read over http, and no other http link is", () => {
  assert.deepEqual(resolveUplinkLink("http://localhost:4000/dist/demo/gonogo-uplink.json"), {
    base: "http://localhost:4000/dist/demo",
    label: "localhost:4000/dist/demo",
  });
  assert.match(String((resolveUplinkLink("http://example.com/x") as { error: string }).error), /https/);
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
    url === "https://h/b/client/README.md"
      ? new Response("# Demo")
      : served.has(url)
        ? new Response(JSON.stringify(served.get(url)))
        : new Response("no", { status: 404 });
  const loaded = await loadUplink("https://h/b", fetcher);
  assert.equal(loaded.root, "https://h/b/client");
  assert.deepEqual(loaded.docs.map((d) => [d.path, d.title, d.url]), [["README.md", "README", "https://h/b/client/README.md"]]);
  assert.equal(loaded.spec.uplink.id, "demo");
  assert.equal(loaded.manifest?.contractMajor, 40);
  assert.equal(loaded.manifestUrl, "https://h/b/client/gonogo-uplink.json");
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

test("a release folder, which ships no README, lists no docs files", async () => {
  const fetcher = async (url: string) =>
    url === "https://h/r/spec.json" ? new Response(JSON.stringify(minimal)) : new Response("no", { status: 404 });
  const loaded = await loadUplink("https://h/r", fetcher);
  assert.equal(loaded.root, "https://h/r");
  assert.deepEqual(loaded.docs, []);
});

test("an address round-trips through its route, and anything else is the home page", () => {
  const base = "https://cdn.jsdelivr.net/gh/o/r@main/uplinks/demo";
  for (const route of [
    { kind: "home" },
    { kind: "overview", base },
    { kind: "doc", base, path: "README.md" },
    { kind: "doc", base, path: "docs/a b.md" },
  ] as const) {
    assert.deepEqual(parseRoute(routeHash(route)), route);
  }
  assert.deepEqual(parseRoute(""), { kind: "home" });
  assert.deepEqual(parseRoute("#/u/%E0%A4%A"), { kind: "home" });
  assert.deepEqual(parseRoute("#section"), { kind: "home" });
});

const context = {
  fileUrl: "https://h/b/client/README.md",
  root: "https://h/b/client",
  docs: [{ path: "README.md", title: "README" }],
  hrefFor: (path: string) => `/uplinks#doc:${path}`,
};

test("raw HTML in a third party's Markdown is shown as text, never run", () => {
  const html = renderMarkdown("<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\ntext <b>bold</b>", context);
  assert.doesNotMatch(html, /<script|<img|<b>/);
  assert.match(html, /&lt;script&gt;/);
});

test("links that are not web links lose their target", () => {
  const html = renderMarkdown("[a](javascript:alert(1)) [b](data:text/html,x) [c](#top) [d](mailto:x@y.z)", context);
  assert.doesNotMatch(html, /href="(javascript|data|mailto|#)/);
});

test("relative links and images resolve against the folder the file was read from", () => {
  const html = renderMarkdown("![shot](docs/assets/a.png) [spec](docs/spec.json) [up](../x.md) [site](https://example.com/p)", context);
  assert.match(html, /src="https:\/\/h\/b\/client\/docs\/assets\/a\.png"/);
  assert.match(html, /href="https:\/\/h\/b\/client\/docs\/spec\.json" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="https:\/\/h\/b\/x\.md"/);
  assert.match(html, /href="https:\/\/example\.com\/p" target="_blank"/);
});

test("a link to another of the Uplink's docs files opens that page on this site", () => {
  const html = renderMarkdown("[readme](./README.md)", context);
  assert.match(html, /href="\/uplinks#doc:README\.md"/);
  assert.doesNotMatch(html, /target=/);
});

test("the comment a generated README opens with is not printed", () => {
  assert.equal(withoutHtmlComments("<!-- a\n b -->\n\n# T").trim(), "# T");
  assert.match(withoutHtmlComments("```\n<!-- keep -->\n```"), /keep/);
  assert.doesNotMatch(renderMarkdown("<!-- Generated -->\n\n# T", context), /Generated/);
});
