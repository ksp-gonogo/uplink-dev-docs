# Project layout

## Starting from the command

In an empty directory:

```bash
npx @ksp-gonogo/uplink-tools@rc new example
```

writes the hand-written seed of an Uplink called `example` and prints what is left to do. It never overwrites a file, and in a repository holding several Uplinks under `uplinks/` it writes `uplinks/example/` instead. See [Known limits](/guide/limits) before relying on it to build outside the Gonogo repositories.

It writes `.gitignore`, `uplink.json`, `client/` (its package.json, two tsconfigs, a vitest config, `uplink.md`, and `src/` with one Heartbeat widget, its test, a `_scene` fixture and the page test), `mod/` (the csproj, a netkan and the plugin class), `mod-contract/` (the contract slice csproj, a payload and its codegen config), `mod-contract-codegen/` (the codegen twin csproj) and `mod-tests/` (an xunit project and its tests).

## Starting from the template

The template lives in `template/` in this documentation's repository. Copy it and rename.

```
example-uplink/
├── mod/
│   └── ExampleUplink/
│       ├── ExampleUplink.csproj
│       ├── ExampleUplink.cs          the plugin
│       ├── MinimalUplink.cs          the smallest Uplink that compiles
│       ├── ExampleModAccess.cs       reflection into the mod you integrate
│       ├── Payloads.cs               wire shapes
│       └── HostSurface.cs            reference examples, not part of the plugin
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx                  mounts the widget
        ├── stream.ts                 the socket client
        ├── binaryFrame.ts            sorts each message by lane
        ├── topics.ts                 your Topic and command shapes
        ├── useExampleStatus.ts       a subscription hook
        ├── ExampleWidget.tsx         the UI
        ├── sendCommand.ts            a typed command call
        ├── sdkSurface.ts             reference examples, not part of the app
        └── ui/                       one example per ui-kit primitive
            └── Provider.tsx          the theme wrapper your tree needs
```

`HostSurface.cs`, `sdkSurface.ts` and everything under `ui/` except `Provider.tsx` exist to compile the reference pages. Delete them once you have copied the template; nothing imports them.

Two independent builds. Nothing is shared between them but the JSON on the wire, and you keep the two payload declarations in step by hand.

## The project file

<<< ../../template/mod/ExampleUplink/ExampleUplink.csproj{xml}

Three things in it are load-bearing.

**`Private="false"` on the `Sitrep.Contract` reference.** KSP loads every `GameData` plugin into a single AppDomain. Shipping your own copy of `Sitrep.Contract.dll` would shadow the one Gonogo loaded, and the two would not be the same types.

**`SitrepContractDll` is a property, not a hard-coded path.** Pass it at build time so the project builds on a machine whose KSP lives somewhere else:

```bash
dotnet build -p:SitrepContractDll="/path/to/GameData/Gonogo/Plugins/Sitrep.Contract.dll"
```

**`net48`.** KSP runs on a Mono runtime matching .NET Framework 4.8. A `net8.0` assembly will not load.

## The client project

<<< ../../template/client/package.json

Next: [The plugin class](/guide/plugin).
