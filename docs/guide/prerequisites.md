# Prerequisites

## For the plugin

- **.NET SDK 8 or later.** The plugin targets `net48`; on macOS and Linux the template pulls in `Microsoft.NETFramework.ReferenceAssemblies` so no Mono install is needed
- **`Sitrep.Contract.dll`.** The Gonogo mod's contract assembly. It is the only Gonogo assembly you may reference, and the only one you need

  It is not on NuGet, and **the Gonogo mod itself is not released yet**: it is on neither CKAN nor SpaceDock, and there is no download. Until it ships, the assembly comes from building the mod from source, from [its repository](https://github.com/ksp-gonogo/gonogo).

  Once installed it is at:

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
npm install @ksp-gonogo/sitrep-sdk @ksp-gonogo/ui-kit \
  react@18 react-dom@18 styled-components
npm install -D @ksp-gonogo/uplink-tools typescript @types/react @types/react-dom vite @vitejs/plugin-react
```

The template's `client/package.json` has the same list, pinned.

Those two, plus `react`, `styled-components` and anything from the wider registry, are the whole of what an Uplink's client may import. The third published package, `@ksp-gonogo/uplink-tools`, is a devDependency: the command line that scaffolds, bundles and documents an Uplink, never imported by the client itself.

## What you may reference

| Half | Allowed | Not allowed |
| --- | --- | --- |
| Plugin | `Sitrep.Contract`, KSP/Unity reference assemblies, the mod you integrate | Any other `Sitrep.*` or `Gonogo.*` assembly |
| Client | `@ksp-gonogo/sitrep-sdk`, `@ksp-gonogo/ui-kit`, third-party packages; `@ksp-gonogo/uplink-tools` as a devDependency | Any other `@ksp-gonogo/*` package |

The restriction is not a policy you can waive: the other assemblies and packages are not distributed, so code that reaches them does not build outside the Gonogo repository.

Next: [Project layout](/guide/project-layout).
