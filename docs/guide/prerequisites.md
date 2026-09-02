# Prerequisites

## For the plugin

- **.NET SDK 8 or later.** The plugin targets `net48`; on macOS and Linux the template pulls in `Microsoft.NETFramework.ReferenceAssemblies` so no Mono install is needed
- **`Sitrep.Contract.dll`.** This is the only Gonogo assembly you may reference, and the only one you need. It is not on NuGet. Take it from a KSP install that has the Gonogo mod:

  ```
  KSP/GameData/Gonogo/Plugins/Sitrep.Contract.dll
  ```

  The shipped build targets `net472`, which a `net48` project consumes without ceremony.

- **KSP reference assemblies**, only if your plugin calls the game directly. They live in your install under `KSP_Data/Managed/`: `Assembly-CSharp.dll`, `Assembly-CSharp-firstpass.dll`, `UnityEngine.dll`, `UnityEngine.CoreModule.dll`. Reference them with `Private="false"`

  The template does not reference them. It reaches the mod it integrates by reflection instead, which keeps the assembly loadable when that mod is absent and keeps that mod's licence off your build.

## For the client

- **Node 18 or later.**
- **React 18.** `@ksp-gonogo/ui-kit@0.1.0` declares a peer dependency on `react@^18`. Installing it alongside React 19 fails outright on npm

```bash
npm install @ksp-gonogo/sitrep-sdk @ksp-gonogo/ui-kit react@18 styled-components
```

Those two, plus `react`, `styled-components` and anything from the wider registry, are the whole of what an Uplink may import. No other `@ksp-gonogo/*` package is published.

## What you may reference

| Half | Allowed | Not allowed |
| --- | --- | --- |
| Plugin | `Sitrep.Contract`, KSP/Unity reference assemblies, the mod you integrate | Any other `Sitrep.*` or `Gonogo.*` assembly |
| Client | `@ksp-gonogo/sitrep-sdk`, `@ksp-gonogo/ui-kit`, third-party packages | Any other `@ksp-gonogo/*` package |

The restriction is not a policy you can waive: the other assemblies and packages are not distributed, so code that reaches them does not build outside the Gonogo repository.

Next: [Project layout](/guide/project-layout).
