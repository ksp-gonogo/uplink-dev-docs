# Start here

This Guide takes you from an empty directory to an Uplink a player can install: what to type, what each file it gives you is for, and how to change it into yours. The [Reference](/reference/) documents every type and function it names.

## What an Uplink is

An Uplink connects something in Kerbal Space Program to Gonogo, the mission control app. It has two halves, built and tested together:

- **A plugin**, a .NET assembly KSP loads beside the Gonogo mod. It reads the game, or another mod, and publishes what it reads on named **Topics**. It can also accept **commands** sent from the app
- **A client**, a JavaScript bundle the Gonogo app loads. It registers **widgets** that read those Topics and send those commands, and it can add to the app's own widgets

The two halves never call each other. The plugin publishes onto the Gonogo mod's telemetry stream and the app reads it, so a widget written against a Topic works the same whether the value left the game a moment ago or several minutes ago across a signal delay.

## The commands

With Node and the .NET SDK installed ([Prerequisites](/guide/prerequisites)), make a directory for the Uplink and run `new` inside it. `new` writes into the directory you run it in; it makes no folder of its own.

```bash
mkdir myuplink && cd myuplink
npx @ksp-gonogo/uplink-tools@rc new
cd client
npm test                     # the client's tests, including the page check
dotnet test ../mod-tests     # the plugin's tests
npm run release              # build both halves and zip the plugin
```

On a terminal, `new` asks seven questions, such as the Uplink's id and your name ([Your first Uplink](/guide/first-uplink#scaffold) lists them). Every answer is also a flag, so a script or an agent with no terminal passes them instead.

That is a working Uplink: a plugin that publishes a heartbeat and a widget that shows it. `release` builds the client, writes what the plugin needs to know about it (`bake`), compiles the plugin, checks the two agree and zips the plugin. Every later page changes something in the Uplink and says which command to run after.

## What else you need

To try the Uplink in the game you need KSP, the Gonogo mod and the Gonogo app:

- **The Gonogo mod** is on [Gonogo's releases page](https://github.com/ksp-gonogo/gonogo/releases), as a zip to unpack into KSP's `GameData` folder
- **The Gonogo app** runs in a browser, at [ksp-gonogo.github.io/rc](https://ksp-gonogo.github.io/rc/) for the <Published field="name" /> this Guide documents

Nothing before [Releasing and installing](/guide/release) needs either.

## How the Guide goes

1. [Prerequisites](/guide/prerequisites) and [Your first Uplink](/guide/first-uplink): install, scaffold, and what each file is
2. The plugin: [the plugin class](/guide/plugin), [publishing a Topic](/guide/topics), [accepting a command](/guide/commands)
3. The client: [a widget](/guide/client-widget), [sending a command](/guide/client-commands), [writing a reckoner](/guide/reckoners), [extending a built-in widget](/guide/extensions)
4. Shipping: [testing](/guide/testing), [documenting your Uplink](/guide/documenting), [releasing and installing](/guide/release)

[Concepts](/guide/concepts) explains the ideas the API is built on, such as what a reading's state is and why a command can arrive late. [Known limits](/guide/limits) lists what the published packages do not do yet.

## The example in this Guide

Every snippet comes from one Uplink, `example`, made with `uplink-tools new` and then extended page by page: a reset command, a button that sends it, and a forward model that carries the count between samples. What `new` wrote is unchanged except where a page says otherwise, so what you see is what `new` gives you. Read it whole in the [documentation's repository](https://github.com/ksp-gonogo/uplink-dev-docs/tree/main/example).

Next: [Prerequisites](/guide/prerequisites).
