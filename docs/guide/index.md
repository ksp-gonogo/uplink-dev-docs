# Start here

This Guide takes you from an empty directory to an Uplink a player can install: what to type, what each file it gives you is for, and how to change it into yours. The [Reference](/reference/) documents every client type and function it names, and the plugin's types; the C# test helpers named on [Testing](/guide/testing#the-plugin-s-tests) are the exception, and the types for adding to the app's own widgets are on [Extensions](/guide/extensions), which this Guide carries in full.

## What an Uplink is

An Uplink connects something in Kerbal Space Program to Gonogo, the mission control app. Gonogo has two parts: the **mod**, which runs inside KSP and reads the game, and the **app**, which runs in a browser and draws the dashboard. Whoever uses the app is its **operator**; this Guide calls them that wherever the app shows them something. An Uplink has two halves, built and tested together:

- **A plugin**, a .NET assembly KSP loads beside the Gonogo mod. It reads the game, or another mod, and publishes what it reads on named **Topics**. It can also accept **commands** sent from the app
- **A client**, a JavaScript bundle the Gonogo app loads. It registers **widgets** that read those Topics and send those commands, and it can add to the app's own widgets

The two halves never call each other. The plugin publishes onto the Gonogo mod's **telemetry stream**, the live feed of Topics the mod serves over one connection and the only way the app reads the game's state, and the app reads it. A widget written against a [Topic](/guide/concepts#topics-and-samples) therefore works the same whether the value left the game a moment ago or several minutes ago across a [signal delay](/guide/concepts#signal-delay-and-command-centres).

## The commands

With Node and the .NET SDK installed ([Prerequisites](/guide/prerequisites)), make a directory for the Uplink and run `uplink-tools new` inside it (`new` is the `uplink-tools` command that scaffolds an Uplink, listed in [the command-line reference](/reference/tools/command-line#new)). It writes into the directory you run it in, and takes the Uplink's id from the directory's name, so this Guide's `example` is the id every later page uses.

```bash
mkdir example && cd example
npx @ksp-gonogo/uplink-tools@rc new
cd client
npm test                     # the client's tests, and the check that the generated page is current
dotnet test ../mod-tests     # the plugin's tests
npm run release              # build both halves and zip the plugin (refuses until uplink.json names a GitHub repository, see below)
```

On a terminal, `new` asks what it was not told, such as the Uplink's id and your name ([Your first Uplink](/guide/first-uplink#scaffold) covers them). Every answer is also a flag, so a script or an agent with no terminal passes them instead: `--yes` takes the default for any question not answered by a flag, and `--no-repo` and `--no-ksp` decline the two that depend on your machine. With no terminal and no `--yes`, `new` writes nothing and names each flag it is missing.

That is a working Uplink: a plugin that publishes a heartbeat and a widget that shows it. The two test commands pass as they are. `npm run release` refuses until `uplink.json` names the GitHub repository the client will be published from: `new` takes it from the directory's `origin` remote, and with no GitHub remote it writes a placeholder: the owner `your-github-owner`, so `repo` is `https://github.com/your-github-owner/example` and `client.url` is `https://cdn.jsdelivr.net/gh/your-github-owner/example@releases/releases/example/0.0.1/example.client.js`. Give `new` a `--repo <owner>/<name>` to set it ([Your first Uplink](/guide/first-uplink#scaffold)), or replace `your-github-owner` with your GitHub owner in `repo` and `client.url` of `uplink.json` afterwards ([Releasing and installing](/guide/release#hosting-the-client)). When it is set, `release` builds the client, writes the plugin's generated files describing it ([`bake`](/reference/tools/command-line#bake): where the client will be hosted and its hash), compiles the plugin, checks the two agree and zips the plugin. Every later page changes something in the Uplink and says which command to run after. `new` runs in the Uplink's directory; every other `npx uplink-tools` command in this Guide, such as `check`, `bake` and `publish`, runs from `client/`, where `npm install` put the tool (from the Uplink's directory `npx` looks the name up on the npm registry and finds nothing).

## What else you need

To try the Uplink in the game you need KSP, the Gonogo mod and the Gonogo app:

- **The Gonogo mod** is a zip to unpack into KSP's `GameData` folder, so that `GameData/Gonogo/` exists. For the <Published field="name" /> it is the `Gonogo-zip` artifact of the newest successful run of [the `rc.yml` workflow](https://github.com/ksp-gonogo/gonogo/actions/workflows/rc.yml) in the Gonogo repository, which GitHub lets a signed-in account download. To get it, sign in to GitHub, open that workflow's page, open the newest run with a green tick, and download the artifact from the bottom of the run's summary. The newest run is a build of the `staging` branch, the one the release candidate is built from, so it can be ahead of the packages this Guide pins. Use the mod from that run with the [`/rc/` app](https://ksp-gonogo.github.io/rc/) below, which the same run builds. If your Uplink's widgets do not appear, open **Settings**, then **Uplinks**, in the app: the line for your Uplink says why the client was refused, for example a contract version it was not built against, meaning a version of the wire types the mod speaks that differs from the one the client was built with ([See your Uplink in the app](/guide/dev-loop#what-settings-shows) lists the lines). If that does not explain it, say so in the Gonogo repository's issues. A release attaches the zip to [Gonogo's releases page](https://github.com/ksp-gonogo/gonogo/releases) instead
- **The Gonogo app** runs in a browser, at [ksp-gonogo.github.io/rc](https://ksp-gonogo.github.io/rc/) for the <Published field="name" /> this Guide documents

Nothing before [Releasing and installing](/guide/release) needs either, except trying a client in the app as you build it ([See your Uplink in the app](/guide/dev-loop)).

## Building against the release candidate

The Guide documents the <Published field="name" />. The `rc` dist-tag names the current candidate; `npm view @ksp-gonogo/uplink-tools dist-tags` shows which version it points at. The three npm packages and the NuGet package are published at that one version and pin each other exactly, so an Uplink builds only against all four at once. `new` writes every pin for you. If you ever add or update one by hand, install the three npm packages together under the `rc` tag, since one beside a release of another fails to resolve:

```bash
npm install @ksp-gonogo/sitrep-sdk@rc @ksp-gonogo/ui-kit@rc @ksp-gonogo/uplink-tools@rc
```

NuGet has no tags, so a C# project names the exact version in its `PackageReference` to `KspGonogo.Sitrep.Contract`. The [`/rc/` app](https://ksp-gonogo.github.io/rc/) is the one built to load an Uplink made this way. [Prerequisites](/guide/prerequisites#the-packages) lists what each package is.

## The pages

Each page's address is written beside its title, because a title does not always say it: [Publishing a Topic](/guide/topics) is `/guide/topics`, and [The plugin class](/guide/plugin) is `/guide/plugin`. Every page of the Guide is listed here.

Getting started:

- [Prerequisites](/guide/prerequisites) (`/guide/prerequisites`): what to install
- [Your first Uplink](/guide/first-uplink) (`/guide/first-uplink`): scaffold, and what each file is for

The plugin:

- [The plugin class](/guide/plugin) (`/guide/plugin`): how Gonogo finds it, its manifest, `Register` and `Health`
- [Publishing a Topic](/guide/topics) (`/guide/topics`): the payload type, codegen, and the source that publishes it
- [Accepting a command](/guide/commands) (`/guide/commands`): its arguments, its handler and its reply
- [Wrapping a mod](/guide/wrapping-a-mod) (`/guide/wrapping-a-mod`): reaching another mod, reading it safely, and saying when it is missing

The client:

- [A widget](/guide/client-widget) (`/guide/client-widget`): registering it and reading a Topic
- [Sending a command](/guide/client-commands) (`/guide/client-commands`): typing the command, and a button that sends it
- [Writing a reckoner](/guide/reckoners) (`/guide/reckoners`): a forward model that carries a value between samples
- [Extensions](/guide/extensions) (`/guide/extensions`): adding to the app's own widgets
- [See your Uplink in the app](/guide/dev-loop) (`/guide/dev-loop`): a rebuild on every save, without releasing

Shipping:

- [Testing](/guide/testing) (`/guide/testing`): both halves, without the game
- [Documenting your Uplink](/guide/documenting) (`/guide/documenting`): the generated page and the doc comments
- [Releasing and installing](/guide/release) (`/guide/release`): building, hosting the client, installing, and CKAN

Background:

- [uplink.json](/guide/uplink-json) (`/guide/uplink-json`): every field, and what reads it
- [Concepts](/guide/concepts) (`/guide/concepts`): readings, signal delay, [reckoning](/reference/concepts/reckoning) (carrying a value forward between samples), [Domains](/reference/concepts/domain-and-seat) (an installed mod as a name a widget can require) and the rest
- [Known limits](/guide/limits) (`/guide/limits`): what the published packages do not do yet

## The example in this Guide

Almost every snippet comes from one Uplink, `example`, made with `uplink-tools new` and then extended page by page: a reset command, a button that sends it, and a forward model that carries the count between samples. The snippets show the finished example, so they include those three additions; `new` writes the same files without them. A page that shows a file with an addition says, directly under the snippet, which lines `new` did not write, so leave those out until you reach the page that adds them. For example, the entry file `client/src/index.ts` shown on [A widget](/guide/client-widget#the-entry) has an `import "./reckoner.js";` line that `new` does not write. A few snippets, named as such on their pages, are separate sketches compiled against the contract that the example has no use for, such as a plugin that wraps a mod. Read it whole in the [documentation's repository](https://github.com/ksp-gonogo/uplink-dev-docs/tree/main/example).

Next: [Prerequisites](/guide/prerequisites).
