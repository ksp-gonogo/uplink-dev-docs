# Your first Uplink

How to scaffold an Uplink, what each file `new` writes is for, and the two commands that prove it works.

## Scaffold

In an empty directory named after the Uplink, run `new`. It writes into that directory, and takes the id from the directory's name unless you give one as the first argument (`new example`).

```bash
mkdir example && cd example
npx @ksp-gonogo/uplink-tools@rc new
```

On a terminal it asks what it was not told. Each question is also a flag, so this asks nothing:

```bash
npx @ksp-gonogo/uplink-tools@rc new example --name Example --author "Your Name" \
  --repo acme/example --topics own --no-workflows --no-ksp
```

[`new` in the command-line reference](/reference/tools/command-line#new) lists every flag with the default it takes, written from the command's own `--help`, so this page does not repeat them. `--yes` takes the default for every question not answered by a flag. With no terminal and no `--yes`, `new` writes nothing and names each flag it is missing.

What the answers do:

- **The id** names the Uplink everywhere: lower-case letters and digits, 2 to 30 of them, starting with a letter. It prefixes the Topics (`example.heartbeat`), the widget ids (`example-heartbeat`) and the C# names: the namespace and assembly are `Gonogo` + the id capitalised + `Uplink` (`GonogoExampleUplink`), and the plugin class is the id capitalised + `Uplink` (`ExampleUplink`). Choose one no other Uplink a player might install is likely to use
- **`--name`** is the display name, shown in the app and on the generated page
- **The author** is shown to the operator (the person using the app) when it asks whether to load your client
- **`--repo`** sets where the released client bundle is fetched from ([Releasing and installing](/guide/release#hosting-the-client)). `acme/example` becomes `https://github.com/acme/example` in `uplink.json`. Use your own GitHub owner: without `--repo`, `new` writes the owner `your-github-owner`, which is the placeholder, and `release` refuses it
- **`--topics core`** makes an Uplink that publishes nothing of its own: its widget reads a Topic Gonogo already publishes, and the plugin exists only to announce the client, so it has no contract slice. **`--topics own`**, the default, adds the contract slice and generated types this Guide uses. This Guide builds one with Topics of its own
- **`--no-repo`** and **`--no-ksp`** decline the two answers that depend on your machine: a GitHub repository, and a KSP folder
- **`--workflows`** writes a GitHub Actions workflow that checks both halves on every push
- **`--ksp`** writes your KSP folder into `ksp.local.props`, for a plugin that calls the game ([The plugin class](/guide/plugin#calling-the-game)). It is kept out of git

`new` never overwrites a file. After writing the files it runs four steps:

- **`bake`** writes the three `*.g.cs` files in `mod/`, which tell the app where the client is hosted and which bundle the plugin vouches for ([`bake` in the command-line reference](/reference/tools/command-line#bake), and [Releasing and installing](/guide/release#build-both-halves) for when it matters)
- **`codegen`** reads the contract slice and writes the client's TypeScript types into `client/src/__generated__/`. It needs the .NET SDK ([Publishing a Topic](/guide/topics#generating-the-client-s-types))
- **`npm install`** in `client/`
- **`npm run page`** writes the generated page ([Documenting your Uplink](/guide/documenting#the-generated-page))

A step that fails is reported with the command to run again, and the files stay in place. Its closing message lists what is left to do, starting with the `description` in `client/src/uplink.ts` ([Documenting your Uplink](/guide/documenting)).

## What it writes

```
example/
├── uplink.json                   the Uplink's identity, and where its client is fetched from
├── README.md                     the generated page
├── .gitignore
├── Directory.Build.props         where to find KSP's assemblies, if the plugin needs them
├── Directory.Build.targets         and the message when it cannot
├── mod/                          the plugin
│   ├── ExampleUplink.cs            the plugin class: its manifest, its sources and its command handlers (the first file you edit)
│   ├── GonogoExampleUplink.csproj
│   ├── GonogoExampleUplink.netkan  the metadata CKAN indexes it from
│   └── Provenance.g.cs, ClientSource.g.cs, ExpectedClientHash.g.cs
│                                   written by bake, never committed
├── mod-contract/                 the contract slice: the Uplink's own wire types
│   ├── ExamplePayloads.cs          the payload of each Topic, the arguments of each command
│   ├── ExampleRtConfig.cs          the configuration for Reinforced.Typings, the library that
│   │                                 writes TypeScript from C#: it lists which of those types
│   │                                 `codegen` turns into TypeScript
│   └── GonogoExampleUplink.Contract.csproj
├── mod-contract-codegen/         the build codegen runs, never shipped
├── mod-tests/                    the plugin's tests
│   ├── ExampleUplinkTests.cs
│   └── GonogoExampleUplink.Tests.csproj
└── client/                       the client package
    ├── package.json
    ├── tsconfig.json, tsconfig.nodenext.json  the client's types, checked twice: under the
    │                               bundler's resolution and under Node's (npm run typecheck, then npm run check)
    ├── vitest.config.ts            the test runner's settings
    ├── gonogo-uplink.json          the client's id, version and integrity hash, which the app reads before it loads the bundle
    ├── docs/widgets.json           each widget's registration (name, description, channels, sizes) as data
    ├── docs/spec.json              the Uplink's spec sheet: its Topics, commands and registrations as data
    └── src/
        ├── index.ts                the bundle's entry: imports every registration
        ├── uplink.ts               the client's identity: id, name, version and the description that opens the page
        ├── commands.ts             the Uplink's commands, typed and registered
        ├── topics.ts               the Uplink's Topics, typed: add a line here for each Topic you publish
        ├── __generated__/          written by codegen from the contract slice
        ├── test/setup.ts           runs before every test
        ├── Heartbeat/              one widget, its test and its fixture
        └── uplink-page.test.ts     fails when the generated page is out of date
```

[Reinforced.Typings](https://www.nuget.org/packages/Reinforced.Typings) is brought in by `codegen` for its own build, so you install nothing for it and the plugin you ship never contains it.

The **contract slice** is a small assembly holding the C# classes that describe what goes on the wire: the payload of each Topic and the arguments of each command. The plugin compiles against it, and `codegen` reads it to write the client's TypeScript types, doc comments included, so the two halves describe a payload the same way. [Publishing a Topic](/guide/topics) covers it.

## uplink.json

<<< ../../example/uplink.json

This is the example's, made with `--author "Uplink docs"` and `--repo ksp-gonogo/uplink-dev-docs`, so it differs from the file the command above writes in three fields: `author`, `repo` and `client.url`. With `--author "Your Name" --repo acme/example` those hold `Your Name`, `https://github.com/acme/example` and `https://cdn.jsdelivr.net/gh/acme/example@releases/releases/example/0.0.1/example.client.js`. `client.url` is where the released bundle will be fetched from ([Releasing and installing](/guide/release#hosting-the-client)). The file holds the Uplink's identity, where its plugin and client go, and how codegen runs. [uplink.json](/guide/uplink-json) lists each field and the command that reads it. The version lives in `client/package.json` instead, and two other places repeat it: `UPLINK_VERSION` in `client/src/uplink.ts`, and the version folder in `client.url`. No command changes all three: you edit them together, then run `npm run page` and `npm run release`, and `release` stops and names the one that disagrees ([A new version](/guide/release#a-new-version)).

## Prove it works

```bash
cd client
npm test
dotnet test ../mod-tests
```

`npm test` runs the widget's test and the page check, which fails when `README.md`, `gonogo-uplink.json`, `docs/widgets.json` or `docs/spec.json` no longer describe what the client registers; it ends with every test file passed. `dotnet test` builds the plugin and runs its tests with no game, constructing the plugin class and calling it directly, and ends `Passed!` with the count.

## What to commit

Everything except what `.gitignore` names: `node_modules`, the build outputs, `ksp.local.props`, and the three `*.g.cs` files `bake` writes into `mod/`, of which `ClientSource.g.cs` can hold a path on the machine that baked it (`DevPath`, the local address a development build loads the client from: [See your Uplink in the app](/guide/dev-loop)). `dist/` is ignored too, so `release` leaves the zip and the netkan out of every commit. You attach the zip to a release by hand, and the netkan you submit to CKAN is the copy in `mod/`, which is committed ([CKAN and SpaceDock](/guide/release#ckan-and-spacedock)). Commit `client/src/__generated__/`, the generated page files and `package-lock.json`: a reader of your repository, and CI, use them without running the generators.

## The heartbeat

The scaffold's plugin publishes one Topic, `example.heartbeat`, carrying a count of how many times it has published and the game time of the last sample. Its widget shows both. The next four pages take the plugin apart ([The plugin class](/guide/plugin), [Publishing a Topic](/guide/topics), [Accepting a command](/guide/commands) and [Wrapping a mod](/guide/wrapping-a-mod)), and the five after them the client ([A widget](/guide/client-widget), [Sending a command](/guide/client-commands), [Writing a reckoner](/guide/reckoners), [Extensions](/guide/extensions) and [See your Uplink in the app](/guide/dev-loop)).

## What to change by hand

The heartbeat is a placeholder for your own Topics and widgets, and `new` writes it in several places that nothing renames for you. When you build your own, change or remove each:

- **The `description`** in `client/src/uplink.ts`, which the closing message names
- **The heartbeat widget**: `client/src/Heartbeat/`, with its test `index.test.tsx` and its fixture `__fixtures__/beating.json`, and the two lines of `client/src/index.ts` that import and export it. Nothing renames the folder or the fixture when you replace the widget, so they keep naming a heartbeat: rename `Heartbeat/` and `beating.json` to what your widget shows, and change the widget's id (`<id>-heartbeat`), which the fixture's `_scene` names and the generated page lists, along with them
- **Every `<id>.heartbeat` reference**: `HeartbeatTopic` and its channel and source in `mod/<Id>Uplink.cs`, the payload class in `mod-contract/<Id>Payloads.cs`, its `typeof(...)` line in the wire-types array of `mod-contract/<Id>RtConfig.cs` ([Publishing a Topic](/guide/topics#generating-the-client-s-types)), its line in the `declare module` block of `client/src/topics.ts` and that file's example comment, and the test in `mod-tests/<Id>UplinkTests.cs` that names it
- **The netkan** `mod/<GameData name>.netkan`: its `abstract` describes the heartbeat, and its `depends` names only `GonogoCore` (the Gonogo mod, as CKAN, the mod manager players install from, knows it), so add the mod you wrap ([Wrapping a mod](/guide/wrapping-a-mod#by-a-compile-time-reference)); its `license` is `MIT` until you change it; it also has no `$kref`, which CKAN needs ([CKAN and SpaceDock](/guide/release#ckan-and-spacedock))
- **`"mod": null`** in `uplink.json`, which names the mod you wrap, if any ([Wrapping a mod](/guide/wrapping-a-mod#in-uplink-json))

`npm test` and `dotnet test ../mod-tests` both pass on what `new` wrote, so run them after each change: a code reference left behind fails to compile or fails a test. To list every line that still names the heartbeat, run this from the Uplink's folder:

```bash
grep -rniI heartbeat . --exclude-dir=node_modules --exclude-dir=bin --exclude-dir=obj
```

The files under `client/src/__generated__/`, `client/docs/` and `README.md` come from the others: `npm run codegen` and `npm run page` rewrite them, so they stop naming it once the rest do. The netkan, the description and `uplink.json` fail nothing when left as they are, so read them over before a release.

Next: [The plugin class](/guide/plugin).
