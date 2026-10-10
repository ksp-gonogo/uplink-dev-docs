# uplink.json

`uplink.json`, at the top of the Uplink, says what the Uplink is as a thing you distribute: its identity, where its plugin and client go, and how codegen runs. `new` writes it from your answers, and the commands read it. [`UplinkDeclaration`](/reference/client/uplink-manifest/manifest#UplinkDeclaration) documents every field, generated from the sdk's own doc comments, with [`UplinkWrappedMod`](/reference/client/uplink-manifest/manifest#UplinkWrappedMod) for `mod` and [`UplinkCodegenDeclaration`](/reference/client/uplink-manifest/manifest#UplinkCodegenDeclaration) for `codegen`. This page adds which command reads each one.

<<< ../../example/uplink.json

<!--@include: @/.vitepress/includes/uplink-declaration-fields.md-->

The version is not here: it is `version` in `client/package.json`, which `bake` writes into the plugin and `page` into the generated page.

## What `release` refuses

- A `client.url` that is still the placeholder `new` writes without a repository (`new --no-repo`, no GitHub remote to take one from, or a repository owned by `you`). Set `repo` and `client.url` to where the bundle will really be published, then run `release` again
- A version folder in `client.url` that is not the version in `client/package.json`
- A client that declares a version (`UPLINK_VERSION`, passed to `defineUplinkClient`) other than the one in `client/package.json`: the app would show the first and the plugin carry the second
- A missing `id`, `gamedata` or `dll`, or no `mod/<gamedata>.csproj`

Next: [Concepts](/guide/concepts).
