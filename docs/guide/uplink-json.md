# uplink.json

`uplink.json`, at the top of the Uplink, says what the Uplink is as a thing you distribute: its identity, where its plugin and client go, and how codegen runs. `new` writes it from your answers, and the commands read it. [`UplinkDeclaration`](/reference/client/uplink-manifest/manifest#UplinkDeclaration) documents every field, and the table below is written from it, so the two cannot disagree, with [`UplinkWrappedMod`](/reference/client/uplink-manifest/manifest#UplinkWrappedMod) for `mod` and [`UplinkCodegenDeclaration`](/reference/client/uplink-manifest/manifest#UplinkCodegenDeclaration) for `codegen`. This page adds which command reads each one.

In the `codegen` block, `assembly` is the contract slice's assembly and `configurationMethod` is the `Configure` method of its `ExampleRtConfig` class, fully qualified, which `codegen` calls to learn which types to turn into TypeScript. Each key of `emits` is the name of an environment variable that `codegen` sets while it runs that method, and its value is the file the slice writes into `client/src/__generated__/` when it reads that variable (`SITREP_EXAMPLE_TOPICMAP_OUT` gives `topic-map.ts`). `new` writes all four, and you change them only if you rename a generated file.

<<< ../../example/uplink.json

<!--@include: @/.vitepress/includes/uplink-declaration-fields.md-->

`minAppVersion` is the oldest Gonogo app release the Uplink is known to work with: the app warns below it and still loads the client. `new` writes `0.0.0`, which claims nothing; raise it to the app release you tested against. The version is not here: it is `version` in `client/package.json`, which `bake` writes into the plugin and `page` into the generated page.

## What `release` refuses

- A `client.url` that is still the placeholder `new` writes without a repository (`new --no-repo`, or no GitHub remote to take one from): an address under the owner `your-github-owner`, such as `https://cdn.jsdelivr.net/gh/your-github-owner/example@releases/releases/example/0.0.1/example.client.js`. Set `repo` and `client.url` to where the bundle will really be published, then run `release` again
- A version folder in `client.url` that is not the version in `client/package.json`
- A client that declares a version (`UPLINK_VERSION`, passed to `defineUplinkClient`) other than the one in `client/package.json`: the app would show the first and the plugin carry the second
- A missing `id`, `gamedata` or `dll`, or no `mod/<gamedata>.csproj`

Next: [Concepts](/guide/concepts).
