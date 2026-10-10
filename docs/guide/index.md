# Start here

This Guide takes you from an empty directory to an Uplink a player can install: what to type, what each file it gives you is for, and how to change it into yours. The [Reference](/reference/) documents every type and function it names.

## What an Uplink is

An Uplink connects something in Kerbal Space Program to Gonogo, the mission control app. Whoever uses the app is its **operator**; this Guide calls them that wherever the app shows them something. An Uplink has two halves, built and tested together:

- **A plugin**, a .NET assembly KSP loads beside the Gonogo mod. It reads the game, or another mod, and publishes what it reads on named **Topics**. It can also accept **commands** sent from the app
- **A client**, a JavaScript bundle the Gonogo app loads. It registers **widgets** that read those Topics and send those commands, and it can add to the app's own widgets

The two halves never call each other. The plugin publishes onto the Gonogo mod's telemetry stream, the one connection the app reads the game's state from, and the app reads it. A widget written against a [Topic](/guide/concepts#topics-and-samples) therefore works the same whether the value left the game a moment ago or several minutes ago across a [signal delay](/guide/concepts#signal-delay-and-command-centres).

## The commands

With Node and the .NET SDK installed ([Prerequisites](/guide/prerequisites)), make a directory for the Uplink and run `new` inside it. `new` writes into the directory you run it in, and takes the Uplink's id from the directory's name, so this Guide's `example` is the id every later page uses.

```bash
mkdir example && cd example
npx @ksp-gonogo/uplink-tools@rc new
cd client
npm test                     # the client's tests, and the check that the generated page is current
dotnet test ../mod-tests     # the plugin's tests
npm run release              # build both halves and zip the plugin (needs the GitHub repository set first, see below)
```

On a terminal, `new` asks what it was not told, such as the Uplink's id and your name ([Your first Uplink](/guide/first-uplink#scaffold) covers them). Every answer is also a flag, so a script or an agent with no terminal passes them instead: `--yes` takes the default for any question not answered by a flag, and `--no-repo` and `--no-ksp` decline the two that depend on your machine. With no terminal and no `--yes`, `new` writes nothing and names each flag it is missing.

That is a working Uplink: a plugin that publishes a heartbeat and a widget that shows it. The two test commands pass as they are. `npm run release` refuses until `uplink.json` names the GitHub repository the client will be published from: `new` takes it from the directory's `origin` remote, and with no GitHub remote it writes a placeholder (so does a repository whose owner is `you`). Give `new` a `--repo <owner>/<name>` to set it ([Your first Uplink](/guide/first-uplink#scaffold)), or set it afterwards ([Releasing and installing](/guide/release#hosting-the-client)). When it is set, `release` builds the client, writes the plugin's generated files describing it ([`bake`](/reference/tools/command-line#bake): where the client will be hosted and its hash), compiles the plugin, checks the two agree and zips the plugin. Every later page changes something in the Uplink and says which command to run after.

## What else you need

To try the Uplink in the game you need KSP, the Gonogo mod and the Gonogo app:

- **The Gonogo mod** is a zip to unpack into KSP's `GameData` folder, so that `GameData/Gonogo/` exists. For the <Published field="name" /> it is the `Gonogo-zip` artifact of the newest successful run of [the `rc.yml` workflow](https://github.com/ksp-gonogo/gonogo/actions/workflows/rc.yml) in the Gonogo repository, which GitHub lets a signed-in account download. To get it, sign in to GitHub, open that workflow's page, open the newest run with a green tick, and download the artifact from the bottom of the run's summary. The newest run is a build of Gonogo's development branch, so it can be ahead of the packages this Guide pins; if your Uplink's widgets do not appear, say so in the Gonogo repository's issues. A release attaches the zip to [Gonogo's releases page](https://github.com/ksp-gonogo/gonogo/releases) instead
- **The Gonogo app** runs in a browser, at [ksp-gonogo.github.io/rc](https://ksp-gonogo.github.io/rc/) for the <Published field="name" /> this Guide documents

Nothing before [Releasing and installing](/guide/release) needs either, except trying a client in the app as you build it ([See your Uplink in the app](/guide/dev-loop)).

## Building against the release candidate

The Guide documents the <Published field="name" />, <Published field="version" />. The three npm packages and the NuGet package are published at that one version and pin each other exactly, so an Uplink builds only against all four at once. `new` writes every pin for you. To add one by hand, install the three npm packages together under the `rc` tag, since one beside a release of another fails to resolve:

```bash
npm install @ksp-gonogo/sitrep-sdk@rc @ksp-gonogo/ui-kit@rc @ksp-gonogo/uplink-tools@rc
```

NuGet has no tags, so a C# project names the exact version in its `PackageReference` to `KspGonogo.Sitrep.Contract`. The [`/rc/` app](https://ksp-gonogo.github.io/rc/) is the one built to load an Uplink made this way. [Prerequisites](/guide/prerequisites#the-packages) lists what each package is.

## The pages

Getting started:

- [Prerequisites](/guide/prerequisites): what to install
- [Your first Uplink](/guide/first-uplink): scaffold, and what each file is for

The plugin:

- [The plugin class](/guide/plugin): how Gonogo finds it, its manifest, `Register` and `Health`
- [Publishing a Topic](/guide/topics): the payload type, codegen, and the source that publishes it
- [Accepting a command](/guide/commands): its arguments, its handler and its reply
- [Wrapping a mod](/guide/wrapping-a-mod): reaching another mod, reading it safely, and saying when it is missing

The client:

- [A widget](/guide/client-widget): registering it and reading a Topic
- [Sending a command](/guide/client-commands): typing the command, and a button that sends it
- [Writing a reckoner](/guide/reckoners): a forward model that carries a value between samples
- [Extensions](/guide/extensions): adding to the app's own widgets
- [See your Uplink in the app](/guide/dev-loop): a rebuild on every save, without releasing

Shipping:

- [Testing](/guide/testing): both halves, without the game
- [Documenting your Uplink](/guide/documenting): the generated page and the doc comments
- [Releasing and installing](/guide/release): building, hosting the client, installing, and CKAN

Background:

- [uplink.json](/guide/uplink-json): every field, and what reads it
- [Concepts](/guide/concepts): readings, signal delay, reckoning, Domains and the rest
- [Known limits](/guide/limits): what the published packages do not do yet

## The example in this Guide

Almost every snippet comes from one Uplink, `example`, made with `uplink-tools new` and then extended page by page: a reset command, a button that sends it, and a forward model that carries the count between samples. The snippets show the finished example, so they include those three additions; `new` writes the same files without them, and each page says which lines are the addition. A few snippets, named as such on their pages, are separate sketches compiled against the contract that the example has no use for, such as a plugin that wraps a mod. Read it whole in the [documentation's repository](https://github.com/ksp-gonogo/uplink-dev-docs/tree/main/example).

Next: [Prerequisites](/guide/prerequisites).
