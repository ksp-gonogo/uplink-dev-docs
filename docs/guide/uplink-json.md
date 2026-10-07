# uplink.json

`uplink.json`, at the top of the Uplink, says what the Uplink is as a thing you distribute: its identity, where its plugin and client go, and how codegen runs. `new` writes it from your answers, and the commands read it. [`UplinkDeclaration`](/reference/client/uplink-manifest/manifest#UplinkDeclaration) documents every field, generated from the sdk's own doc comments, with [`UplinkWrappedMod`](/reference/client/uplink-manifest/manifest#UplinkWrappedMod) for `mod` and [`UplinkCodegenDeclaration`](/reference/client/uplink-manifest/manifest#UplinkCodegenDeclaration) for `codegen`. This page adds which command reads each one.

<<< ../../example/uplink.json

| Field | Read by | What it is |
| --- | --- | --- |
| [`id`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.id) | every command | The Uplink's id, the same one `defineUplinkClient` and the plugin's `[SitrepUplink]` name |
| [`name`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.name) | `bake`, `page`, `bundle` | The name an operator sees |
| [`author`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.author) | `bake`, `page`, `bundle` | Who wrote it, shown when the app asks the operator whether to load the client |
| [`repo`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.repo) | `bake`, `page`, `bundle` | The URL of its source repository, shown beside the author |
| [`gamedata`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.gamedata) | `package`, `release` | The folder the plugin installs into under the game's `GameData` |
| [`dll`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.dll) | `package`, `release` | The file name of the plugin assembly the build writes |
| [`minAppVersion`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.minAppVersion) | `page`, `bundle` | The oldest app version it is known to work with; below it the app warns and still loads the client |
| [`mod`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.mod) | `page` | The KSP mod the Uplink wraps, or `null` ([Wrapping a mod](/guide/wrapping-a-mod#in-uplink-json)) |
| [`codegen`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.codegen) | `codegen` | How `codegen` runs: the contract slice's assembly, its configuration method and the files it writes |
| [`csharpNamespace`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.csharpNamespace) | `bake` | The namespace `bake` writes the plugin's generated files in |
| [`client`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.client) | `bake`, `release` | Where the released client bundle is fetched from, as `client.url` |

The version is not here: it is `version` in `client/package.json`, which `bake` writes into the plugin and `page` into the generated page.

## What `release` refuses

- A `client.url` that is still the placeholder `new` writes without a repository (`new --no-repo`, or no GitHub remote to take one from). Set `repo` and `client.url` to where the bundle will really be published, then run `release` again
- A version folder in `client.url` that is not the version in `client/package.json`
- A client that declares a version (`UPLINK_VERSION`, passed to `defineUplinkClient`) other than the one in `client/package.json`: the app would show the first and the plugin carry the second
- A missing `id`, `gamedata` or `dll`, or no `mod/<gamedata>.csproj`

Next: [Concepts](/guide/concepts).
