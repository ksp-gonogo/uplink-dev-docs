import assert from "node:assert/strict";
import { test } from "node:test";
import { whatItCarries } from "./indexes.mjs";
import { dropRestatedId } from "./typescript.mjs";

test("a Topic's description drops the clause that names the Topic", () => {
  assert.equal(
    whatItCarries("The `career.facilities` Topic payload: the space centre's buildings.", false),
    "The space centre's buildings.",
  );
  assert.equal(dropRestatedId("The `comms.degrade` payload: how degraded the link is."), "How degraded the link is.");
});

test("a Topic that carries a list says so, since its comment describes one entry", () => {
  assert.equal(
    whatItCarries("One command centre in the `commandCentre.roster` channel: a vantage.", true),
    "A list. Each entry is one command centre in the `commandCentre.roster` channel: a vantage.",
  );
  assert.equal(
    whatItCarries("One entry in the `deployed.bases` Topic payload: a Breaking Ground experiment.", true),
    "A list. Each entry is a Breaking Ground experiment.",
  );
});

test("a description with no restated id is left alone", () => {
  assert.equal(whatItCarries("The game's time-warp state.", false), "The game's time-warp state.");
});
