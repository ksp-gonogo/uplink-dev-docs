# Prerequisites

What to install before running `uplink-tools new`, and what an Uplink may depend on once it exists.

## Tools

- **Node 20 or later**, with npm. The client's test runner needs it
- **The .NET SDK 10 or later.** The plugin targets `net48`, which KSP loads, and the scaffold brings in the .NET Framework reference assemblies as a package, so it builds on macOS and Linux with no Mono install. The plugin's tests run on `net10.0`
- **Chromium for Playwright**, only to draw your widget's pictures (`npm run render` and `npm run docs`): `npx playwright install chromium`, a download of about 100 MB, once per machine. Nothing else in the Guide needs a browser
- **KSP, the Gonogo mod and the Gonogo app**, only to try the Uplink in the game ([Start here](/guide/#what-else-you-need) says where to get them). Nothing before [Releasing and installing](/guide/release) needs them

No clone of any repository is needed, and no KSP assembly unless your plugin calls the game directly ([The plugin class](/guide/plugin#calling-the-game)).

## The packages

`new` writes every dependency into the Uplink's own files, each pinned to one release candidate, today the <Published field="version" />. You install nothing by hand.

| Package | Where | What it is |
| --- | --- | --- |
| `KspGonogo.Sitrep.Contract` | NuGet, each C# project | The Gonogo mod's contract: the plugin interface, the manifest types and the core wire types |
| `@ksp-gonogo/sitrep-sdk` | npm, the client | Topics, commands, readings and the registration API |
| `@ksp-gonogo/ui-kit` | npm, the client | The components the app's own widgets are drawn with |
| `@ksp-gonogo/uplink-tools` | npm, the client's devDependencies | The command line: scaffold, codegen, bundle, bake, release, page and docs |

The contract has one name per place you meet it: `KspGonogo.Sitrep.Contract` is the NuGet package, `Sitrep.Contract` the assembly and namespace inside it, and `Sitrep.Contract.dll` the file the Gonogo mod ships in `GameData`.

All four are published at the same version, and the scaffold pins them exactly, so both halves build against one contract. The `rc` in `npx @ksp-gonogo/uplink-tools@rc` is the npm tag of the <Published field="name" />.

## What an Uplink may reference

| Half | Allowed | Not allowed |
| --- | --- | --- |
| Plugin | `Sitrep.Contract`, the Uplink's own contract slice, KSP and Unity assemblies, the mod it integrates | Any other Gonogo assembly |
| Client | `@ksp-gonogo/sitrep-sdk`, `@ksp-gonogo/ui-kit`, React 18, styled-components, any other npm package | Any other `@ksp-gonogo/*` package |

Nothing else of Gonogo is published, so code that reaches for it does not build outside Gonogo's own repository. The client uses React 18: the kit does not install beside React 19. The plugin never ships its own copy of `Sitrep.Contract.dll`: the Gonogo mod provides it in the game, and the scaffold's project files compile against it without copying it.

Next: [Your first Uplink](/guide/first-uplink).
