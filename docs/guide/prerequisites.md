# Prerequisites

What to install before running `uplink-tools new`, and what an Uplink may depend on once it exists.

## Tools

- **Node 20 or later**, with npm. The client's test runner needs it
- **The .NET SDK 10 or later.** The plugin targets `net48`, which KSP loads, and the scaffold brings in the .NET Framework reference assemblies as a package, so it builds on macOS and Linux with no Mono install. The plugin's tests run on `net10.0`
- **KSP with the Gonogo mod installed**, only to try the Uplink in the game. Nothing before [Releasing and installing](/guide/release) needs the game

No clone of any repository is needed, and no KSP assembly unless your plugin calls the game directly ([The plugin class](/guide/plugin#calling-the-game)).

## The packages

`new` writes every dependency into the Uplink's own files, each pinned to one release candidate, today the <Published field="version" />. You install nothing by hand.

| Package | Where | What it is |
| --- | --- | --- |
| `KspGonogo.Sitrep.Contract` | NuGet, each C# project | The Gonogo mod's contract: the plugin interface, the manifest types and the core wire types |
| `@ksp-gonogo/sitrep-sdk` | npm, the client | Topics, commands, readings and the registration API |
| `@ksp-gonogo/ui-kit` | npm, the client | The components the app's own widgets are drawn with |
| `@ksp-gonogo/uplink-tools` | npm, the client's devDependencies | The command line: scaffold, codegen, bundle, bake, release, page and docs |

All four are published at the same version, and the scaffold pins them exactly, so both halves build against one contract. The `rc` in `npx @ksp-gonogo/uplink-tools@rc` is the npm tag of the <Published field="name" />.

## What an Uplink may reference

| Half | Allowed | Not allowed |
| --- | --- | --- |
| Plugin | `Sitrep.Contract`, the Uplink's own contract slice, KSP and Unity assemblies, the mod it integrates | Any other Gonogo assembly |
| Client | `@ksp-gonogo/sitrep-sdk`, `@ksp-gonogo/ui-kit`, React, styled-components, any other npm package | Any other `@ksp-gonogo/*` package |

Nothing else of Gonogo is published, so code that reaches for it does not build outside Gonogo's own repository. The plugin never ships its own copy of `Sitrep.Contract.dll`: the Gonogo mod provides it in the game, and the scaffold's project files compile against it without copying it.

Next: [Your first Uplink](/guide/first-uplink).
