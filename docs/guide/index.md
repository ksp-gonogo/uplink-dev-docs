# What an Uplink is

An Uplink connects one KSP mod to Gonogo. It has two halves:

- **A plugin**, a .NET assembly that runs inside KSP next to the Gonogo mod. It reads the mod you are integrating and publishes data onto named **Topics**, and accepts **commands** sent back from the ground
- **A client**, browser code that subscribes to those Topics and renders them

The two halves never call each other. They meet at a WebSocket the Gonogo mod serves, carrying JSON messages whose shapes are typed in `@ksp-gonogo/sitrep-sdk`.

## What you can build today

The published packages cover both halves: the plugin, and a client that either registers widgets into the Gonogo dashboard or runs as a standalone page speaking the stream directly. [Known limits](/guide/limits) states what they do not do.

The command line is `@ksp-gonogo/uplink-tools`. `npx @ksp-gonogo/uplink-tools new <id>` scaffolds an Uplink, and the same package bundles, renders and documents it. Each command answers `--help`, and [Command line](/reference/tools/command-line) prints every command's help. `@ksp-gonogo/uplink-tools` is not on npm at the <Published field="name" /> yet: the command arrives with the next one.

## Vocabulary

| Term               | Meaning                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Topic**          | A named stream of one payload shape, e.g. `vessel.orbit`. Clients subscribe by name.                                                |
| **Command**        | A named request a client sends to the plugin, with typed arguments and a typed result.                                              |
| **UT**             | Universal Time, the game's clock in seconds. Every published value is stamped with the UT it was true at.                           |
| **Courier thread** | The background thread that packs and sends frames. It must never touch the game.                                                    |
| **Command centre** | A control position an operator works from. A mission can have several, at different distances from the vessel.                      |
| **Vantage**        | Which command centre a message entered from, and whose delay it is subject to. Relevant only if you care where a command came from. |

## The example in this guide

Every page builds one Uplink, `example`, integrating a fictional Example Mod. It publishes an `example.status` Topic and accepts an `example.setMode` command. Every snippet is compiled from the [template](/guide/project-layout) in this documentation's repository.

Next: [Prerequisites](/guide/prerequisites).
