# uplink.json

`uplink.json`, at the top of the Uplink, says what the Uplink is as a thing you distribute: its identity, where its plugin and client go, and how codegen runs. `new` writes it from your answers, and the commands read it. [`UplinkDeclaration`](/reference/client/uplink-manifest/manifest#UplinkDeclaration) documents every field, generated from the sdk's own doc comments, with [`UplinkWrappedMod`](/reference/client/uplink-manifest/manifest#UplinkWrappedMod) for `mod` and [`UplinkCodegenDeclaration`](/reference/client/uplink-manifest/manifest#UplinkCodegenDeclaration) for `codegen`. This page adds which command reads each one.

<<< ../../example/uplink.json

| Field | Read by | What it is |
| --- | --- | --- |
| `id` | every command | [`UplinkDeclaration.id`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.id) |
| `name` | `bake`, `page`, `bundle` | [`UplinkDeclaration.name`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.name) |
| `author` | `bake`, `page`, `bundle` | [`UplinkDeclaration.author`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.author) |
| `repo` | `bake`, `page`, `bundle` | [`UplinkDeclaration.repo`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.repo) |
| `gamedata` | `package`, `release` | [`UplinkDeclaration.gamedata`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.gamedata) |
| `dll` | `package`, `release` | [`UplinkDeclaration.dll`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.dll) |
| `minAppVersion` | `page`, `bundle` | [`UplinkDeclaration.minAppVersion`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.minAppVersion) |
| `mod` | `page` | [`UplinkDeclaration.mod`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.mod) |
| `codegen` | `codegen` | [`UplinkDeclaration.codegen`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.codegen) |
| `csharpNamespace` | `bake` | [`UplinkDeclaration.csharpNamespace`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.csharpNamespace) |
| `client` | `bake`, `release` | [`UplinkDeclaration.client`](/reference/client/uplink-manifest/manifest#UplinkDeclaration.client) |

The version is not here: it is `version` in `client/package.json`, which `bake` writes into the plugin and `page` into the generated page.

## What `release` refuses

- A `client.url` that is still the placeholder `new` writes without a repository (`new --no-repo`, or no GitHub remote to take one from). Set `repo` and `client.url` to where the bundle will really be published, then run `release` again
- A version folder in `client.url` that is not the version in `client/package.json`
- A missing `id`, `gamedata` or `dll`, or no `mod/<gamedata>.csproj`

Next: [Concepts](/guide/concepts).
