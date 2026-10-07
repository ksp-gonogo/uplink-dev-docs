# uplink.json

`uplink.json`, at the top of the Uplink, says what the Uplink is as a thing you distribute: its identity, where its plugin and client go, and how codegen runs. `new` writes it from your answers, and the commands read it. This page lists every field, which command reads it, and what it changes.

<<< ../../example/uplink.json

| Field | Read by | What it does |
| --- | --- | --- |
| `id` | every command | The Uplink's id, the same as in `SitrepUplinkAttribute` and `defineUplinkClient`. `page` and `bundle` refuse a manifest whose id disagrees with the client's |
| `name` | `bake`, `page`, `bundle` | The display name, shown when the app asks the operator whether to load the client, and on the generated page |
| `author` | `bake`, `page`, `bundle` | Who wrote the Uplink, shown beside the name in the same places |
| `repo` | `bake`, `page`, `bundle` | The repository's URL, shown the same way. `new --repo you/example` writes `https://github.com/you/example` |
| `gamedata` | `package`, `release` | The folder the plugin is installed into under `GameData`, and the name of the plugin's project, `mod/<gamedata>.csproj` |
| `dll` | `package`, `release` | The plugin's file name, which the zip holds and `release` checks |
| `minAppVersion` | `page`, `bundle` | The oldest Gonogo app the client works with, copied into `gonogo-uplink.json`. The app warns when it is older, and still loads the client |
| `mod` | `page` | The mod the Uplink wraps, as `name`, `builtAgainst` and `tier` (how a player gets it, such as `"ckan"`); `null` for none. The page prints it; nothing else reads it, so it gates nothing ([Wrapping a mod](/guide/wrapping-a-mod#in-uplink-json)) |
| `codegen` | `codegen` | Which assembly to generate types from (`assembly`), its configuration method (`configurationMethod`), and the files it writes (`emits`). Written by `new` and needs no edit |
| `csharpNamespace` | `bake` | The namespace of the three files `bake` writes into `mod/` |
| `client.url` | `bake`, `release` | Where the app fetches the client bundle from ([Releasing and installing](/guide/release#hosting-the-client)). An Uplink with no `client` announces no client, for a plugin with nothing to draw |

The version is not here: it is `version` in `client/package.json`, which `bake` writes into the plugin and `page` into the generated page.

## What `release` refuses

- A `client.url` that is still the placeholder `new` writes without a repository (`new --no-repo`, or no GitHub remote to take one from). Set `repo` and `client.url` to where the bundle will really be published, then run `release` again
- A missing `id`, `gamedata` or `dll`, or no `mod/<gamedata>.csproj`

Next: [Concepts](/guide/concepts).
