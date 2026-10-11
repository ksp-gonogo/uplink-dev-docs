# Documenting your Uplink

An Uplink is documented in two places, both written next to the code: its generated page, the `README.md` a player reads on its repository, and the doc comments an author reads in the code and in their editor. This page covers where each part comes from and how to write it.

## The generated page

`npm run page`, from `client/`, writes three files, the same three `npm run docs` writes: `README.md`, `gonogo-uplink.json` (what the app reads about the client before it loads it) and `docs/widgets.json` (each widget's registration, as a record). Each part of the page comes from one place:

| On the page | Written in |
| --- | --- |
| The opening paragraph | `description` in `defineUplinkClient`, in `src/uplink.ts` |
| The id and version | `id` and `version` in `defineUplinkClient` |
| Built against | The packages the client was built with: the contract version (the wire contract's own `Major.Minor`, stamped on `Sitrep.Contract.dll`, such as 29.22, not the package's release number) and the extension API version of the sdk and ui-kit (the version of the surface a client may call), the two versions the Gonogo mod and app check an Uplink against when they load one. Neither is the package version |
| The Wire table | The plugin's manifest: each channel's Topic, payload type, delivery and delay |
| The Commands tables | The contract slice's `SitrepCommandAttribute` classes, through the command map `codegen` writes: each command, its arguments type and its result, then each arguments type's fields |
| Each widget's heading, paragraph and facts | Its `registerComponent` call: `name`, `description`, `channels`, `defaultSize`, and the number of its fixtures as Scenes |
| Each widget's pictures | Its fixtures, with `_scene.caption` as the picture's description |
| The Models table | Every reckoner the client registers |

Here is the example's, as `npm run page` writes it:

<<< ../../example/client/README.md{md}

To change the page, change what it is written from and run `npm run page` again. Never edit the three files by hand: `npm test` includes a check that fails when they no longer match what the client registers, and the next `npm run page` would overwrite the edit. Commit them with the change that moved them. `npm run page` refuses an Uplink or a widget with no description.

## The pictures

`npm run page` writes the page with no browser and leaves the pictures alone, so until `npm run docs` has run the page names pictures that do not exist yet. `npm run docs` writes the same three files and draws a picture of every fixture into `docs/assets/`, which needs Chromium (`npx playwright install chromium`). Run it before you publish, and commit `docs/assets/` with the page.

A fixture's `_scene.caption` describes its picture to anyone who cannot see it, so say what the widget shows in that scene: "The Example Uplink publishing: 42 ticks since load, at UT 1,000,000", not "Heartbeat widget". [Testing](/guide/testing#fixtures) covers fixtures.

## Writing the descriptions

The Uplink's `description` and each widget's `description` are read by a player deciding what to install and by an operator adding a widget, neither of whom has seen your code:

- **Say what it shows or does**, in the operator's words, and what an operator can do with it: "How many samples the Example Uplink has published, and the game time of the latest one. Reset starts the count again", not "Heartbeat component"
- **Name the mod it needs**, in the Uplink's description, when it integrates one
- **Leave out how it works and how it came to be.** The page describes the Uplink as it is now; the repository's history holds the rest

## Doc comments

`new` writes a doc comment on everything an author changes first, and each says what the thing is and the one rule that matters about it. Write yours the same way as you add code.

**The contract slice.** Each wire type says what its Topic carries and when nothing is published, and each property what the value is, its unit and when it is `null`:

<<< ../../example/mod-contract/ExamplePayloads.cs#heartbeat{cs}

These comments are the ones that travel: `codegen` copies them into `client/src/__generated__/contract.ts`, so an author hovering a field in the client reads them. A paragraph inside `<internal>` stays in the C#, for whoever maintains the plugin, and never reaches the client.

**The plugin.** The class says what it publishes and how; each member what it is for and the rule that bites, such as the sample's "runs on the Courier thread" and "returning null publishes nothing" ([The plugin class](/guide/plugin#the-sample)).

**The client.** `uplink.ts` says the description opens the generated page; `topics.ts` what its `declare module` block is for, with an example of reading the Topic; the widget what it shows and why it says "waiting" rather than a zero; the registration what its `description` and `channels` are for.

The same rules apply as for the descriptions: what it is, not why it came to be that way.


## A picture of one Storybook story

The scaffold has no Storybook. If you keep one, `npx uplink-tools story <story-id>` draws one of its stories to `renders/<id>.png`, or to a GIF when the story is tagged `playback`. It reads `./storybook-static`, and `--storybook <dir|url>` points at a built Storybook or a running one. `--list [text]` prints the story ids that contain the text instead of rendering.

Next: [Releasing and installing](/guide/release).
