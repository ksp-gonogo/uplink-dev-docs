# Documenting your Uplink

An Uplink's page, the `README.md` a player reads on its repository, is generated from the code: its description, its widgets, its Topics and its pictures all come from what the client registers and what the plugin declares. This page covers where each part comes from, how to write them, and how the page stays true.

## The generated page

`npm run page`, from `client/`, writes three files: `README.md`, `gonogo-uplink.json` (what the app reads about the client before it loads it) and `docs/widgets.json` (a record of each widget). Each part of the page comes from one place:

| On the page | Written in |
| --- | --- |
| The opening paragraph | `description` in `defineUplinkClient`, in `src/uplink.ts` |
| The id and version | `id` and `version` in `defineUplinkClient` |
| The Wire table | The plugin's manifest: each channel's Topic, payload type, delivery and delay |
| Each widget's heading, paragraph and facts | Its `registerComponent` call: `name`, `description`, `channels`, `defaultSize` |
| Each widget's pictures | Its fixtures, with `_scene.caption` as the picture's description |
| The Models table | Every reckoner the client registers |

Here is the example's, as `npm run page` writes it:

<<< ../../example/client/README.md{md}

To change the page, change what it is written from and run `npm run page` again. Never edit the three files by hand: `npm test` includes a check that fails when they no longer match what the client registers, and the next `npm run page` would overwrite the edit. Commit them with the change that moved them.

## The pictures

`npm run page` writes the page with no browser and leaves the pictures alone. `npm run docs` writes the same three files and draws a picture of every fixture into `docs/assets/`, which needs Chromium (`npx playwright install chromium`). Until it runs, the page names pictures that do not exist yet.

A fixture's `_scene.caption` describes its picture to anyone who cannot see it, so say what the widget shows in that scene: "The Example Uplink publishing: 42 ticks since load, at UT 1,000,000", not "Heartbeat widget". [Testing](/guide/testing#fixtures) covers fixtures.

## Writing the descriptions

The Uplink's `description` and each widget's `description` are read by a player deciding what to install and by an operator adding a widget, neither of whom has seen your code:

- **Say what it shows or does**, in the operator's words: "How many times the Example Uplink has published, and the universal time of the last sample", not "Heartbeat component"
- **Name the mod it needs**, in the Uplink's description, when it integrates one
- **Leave out how it works and how it came to be.** The page describes the Uplink as it is now; the repository's history holds the rest

## Doc comments

The page is written from registrations, not from doc comments, but your code has readers too: you in six months, and anyone extending your Uplink. Write a doc comment on each wire type and each of its properties in the contract slice, saying what the value is, its unit and when it is `null`, as the scaffold's `ExampleHeartbeat` does. The same rules apply as for the descriptions: what it is, not why it is that way.

## What will change

The scaffold writes `client/uplink.md` and its closing message asks you to say what the Uplink is for there. Nothing reads that file today: the page's opening paragraph is `description` in `src/uplink.ts`, so write it there. A coming release of the scaffold carries doc comments in every file it writes, in the form this page describes, and this page will follow it.

Next: [Releasing and installing](/guide/release).
