# Project layout

The template lives in `template/` in this documentation's repository. Copy it and rename.

```
example-uplink/
├── mod/
│   └── ExampleUplink/
│       ├── ExampleUplink.csproj
│       ├── ExampleUplink.cs          the plugin
│       ├── ExampleModAccess.cs       reflection into the mod you integrate
│       └── Payloads.cs               wire shapes
└── client/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── stream.ts                 the socket client
        ├── topics.ts                 your Topic and command shapes
        ├── useExampleStatus.ts       a subscription hook
        └── ExampleWidget.tsx         the UI
```

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
