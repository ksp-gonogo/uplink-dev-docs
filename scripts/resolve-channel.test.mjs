import assert from "node:assert/strict";
import test from "node:test";
import { agreeingVersion, commitFor, withChannel } from "./resolve-channel.mjs";

const SHA = "a0f8d780caeaec4a8105290708dc0b4a67ef8b73";
const OTHER = "9536a667c6464fc4034fd7c5181149496d5e8c68";

test("packages on one version agree", () => {
  assert.equal(agreeingVersion({ a: "1.0.0", b: "1.0.0" }, "latest"), "1.0.0");
});

test("a set mid-publish, or a package never published, is refused", () => {
  assert.throws(() => agreeingVersion({ a: "1.0.1-rc.2", b: "1.0.0" }, "rc"), /do not agree/);
  assert.throws(() => agreeingVersion({ a: "1.0.0", b: "" }, "latest"), /not published/);
});

test("the recorded gitHead wins, and differing ones are refused", () => {
  assert.equal(commitFor("1.1.0-rc.3", [SHA, SHA, SHA], undefined), SHA);
  assert.throws(() => commitFor("1.1.0-rc.3", [SHA, OTHER, SHA], undefined), /different commits/);
});

test("a plain release without gitHead uses its tag; a candidate without one is refused", () => {
  assert.equal(commitFor("1.0.0", ["", "", ""], SHA), SHA);
  assert.throws(() => commitFor("1.1.0-rc.3", ["", "", ""], SHA), /records no commit/);
  assert.throws(() => commitFor("1.0.0", ["", "", ""], undefined), /records no commit/);
});

test("the channel block is written and the packed-artifact entries are kept", () => {
  const out = withChannel({ gonogo: OTHER, published: {}, npm: { x: "file:y" } }, "rc", "1.1.0-rc.3", SHA);
  assert.deepEqual(out.published, { version: "1.1.0-rc.3", npmTag: "rc", name: "release candidate" });
  assert.equal(out.gonogo, SHA);
  assert.deepEqual(out.npm, { x: "file:y" });
});
