# Your first Uplink

How to scaffold an Uplink, what each file `new` writes is for, and the two commands that prove it works.

## Scaffold

In an empty directory named after the Uplink:

```bash
npx @ksp-gonogo/uplink-tools@rc new example --author "Your Name" --repo you/example
```

- **The id** (`example`) names the Uplink everywhere: its Topics start `example.`, its plugin is `GonogoExampleUplink.dll`, and its widgets' ids start `example-`. Lower case, and unique across every Uplink a player might install
- **`--author`** is shown to the operator when the app asks whether to load your client
- **`--repo`** is the GitHub repository the Uplink will live in. It sets where the released client bundle is fetched from ([Releasing and installing](/guide/release#hosting-the-client)). Without it the URL is a placeholder, and `npm run release` refuses it

`new` never overwrites a file. After writing the files it runs four steps: `bake`, `codegen` (which needs the .NET SDK), `npm install` in `client/`, and `npm run page`. A step that fails is reported with the exact command to run again, and the files stay in place.

## What it writes

```
example/
├── uplink.json                   the Uplink's identity, and where its client is fetched from
├── Directory.Build.props/.targets  where to find KSP's assemblies, if the plugin needs them
├── mod/                          the plugin
│   ├── ExampleUplink.cs            the plugin class
│   ├── GonogoExampleUplink.csproj
│   ├── GonogoExampleUplink.netkan  the CKAN metadata
│   └── *.g.cs                      written by bake, never committed
├── mod-contract/                 the contract slice: the Uplink's own wire types
│   ├── ExamplePayloads.cs
│   └── ExampleRtConfig.cs          how codegen turns them into TypeScript
├── mod-contract-codegen/         the build codegen runs, never shipped
├── mod-tests/                    the plugin's tests
└── client/                       the client package
    ├── package.json
    ├── uplink.md
    └── src/
        ├── index.ts                the bundle's entry: imports every registration
        ├── uplink.ts               the client's identity
        ├── topics.ts               the Uplink's Topics, typed
        ├── __generated__/          written by codegen from the contract slice
        ├── Heartbeat/              one widget, its test and its fixture
        └── uplink-page.test.ts     fails when the generated page is out of date
```

The **contract slice** is a small assembly holding the C# classes that describe what goes on the wire: the payload of each Topic and the arguments of each command. The plugin compiles against it, and `codegen` reads it to write the client's TypeScript types, so the two halves cannot disagree about a payload's shape. [Publishing a Topic](/guide/topics) covers it.

## uplink.json

<<< ../../example/uplink.json

`id`, `name`, `author` and `repo` are what `bake` writes into the plugin, so the app can show who made the client before it loads it. `gamedata` and `dll` are the folder and file the release lays out under `GameData`. `client.url` is where the app fetches the bundle from. `codegen` tells `codegen` which assembly and configuration to run, and needs no edit.

The version lives in `client/package.json`, and `bake` reads it from there. Two other places repeat it and must be changed with it: `UPLINK_VERSION` in `client/src/uplink.ts`, and the version folder in `client.url`.

## Prove it works

```bash
cd client
npm test
dotnet test ../mod-tests
```

`npm test` runs the widget's test and the page check, which fails when `README.md`, `gonogo-uplink.json` or `docs/widgets.json` no longer describe what the client registers. `dotnet test` runs the plugin's tests with no game: they construct the plugin class and call it directly.

## What to commit

Everything except what `.gitignore` names: `node_modules`, the build outputs, and the three `*.g.cs` files, one of which can hold a path on the machine that baked it. Commit `client/src/__generated__/`, the generated page files and `package-lock.json`: a reader of your repository, and CI, use them without running the generators.

## The heartbeat

The scaffold's plugin publishes one Topic, `example.heartbeat`, carrying a count of how many times it has published and the game time of the last sample. Its widget shows both. The next three pages take the plugin apart; the three after them, the client.

Next: [The plugin class](/guide/plugin).
