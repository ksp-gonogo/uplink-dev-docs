import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import MarkdownIt from "markdown-it";
import { channelTag, tagSuffix } from "./channel-tag.mjs";

const PAGES = ["first-uplink", "index", "dev-loop"].map((name) => `docs/guide/${name}.md`);
const PACKAGES = ["uplink-tools", "sitrep-sdk", "ui-kit"].map((name) => `@ksp-gonogo/${name}`);

function render(file, npmTag) {
  const md = new MarkdownIt();
  channelTag(md, tagSuffix(npmTag));
  return md.render(readFileSync(file, "utf8"));
}

const installLines = (html) =>
  (html.match(/(?:npx|npm install)[^<\n]*/g) ?? []).filter((line) => line.includes("@ksp-gonogo/"));

function sources(dir) {
  return readdirSync(dir).flatMap((entry) => {
    if (entry === "node_modules" || entry === "dist" || entry === "cache") return [];
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? sources(path) : /\.(md|vue|mts?|mjs)$/.test(entry) && !path.endsWith("channel-tag.test.mjs") ? [path] : [];
  });
}

test("the root keeps every install line plain", () => {
  for (const file of PAGES) {
    const lines = installLines(render(file, "latest"));
    assert.ok(lines.length > 0, `${file} has an install line`);
    for (const line of lines) assert.doesNotMatch(line, /@ksp-gonogo\/[a-z-]+@/, `${file}: ${line}`);
  }
});

test("/rc/ puts @rc after each package on every install line", () => {
  for (const file of PAGES) {
    const lines = installLines(render(file, "rc"));
    assert.ok(lines.length > 0, `${file} has an install line`);
    for (const line of lines) {
      for (const name of PACKAGES) {
        if (line.includes(name)) assert.ok(line.includes(`${name}@rc`), `${file}: ${line}`);
      }
      assert.doesNotMatch(line, /@ksp-gonogo\/[a-z-]+(?!@rc)(?:\s|$)/, `${file}: ${line}`);
    }
  }
});

test("a name that already has a version keeps it", () => {
  const md = new MarkdownIt();
  channelTag(md, "@rc");
  assert.match(md.render("```\nnpm install @ksp-gonogo/ui-kit@1.0.0\n```"), /ui-kit@1\.0\.0\b(?!@rc)/);
});

test("no source file carries the old placeholder", () => {
  const found = [...sources("docs"), ...sources("scripts"), "README.md"].filter((file) =>
    readFileSync(file, "utf8").includes("@@tag@@"),
  );
  assert.deepEqual(found, []);
});
