# Your first Uplink

How to scaffold an Uplink, what each file `new` writes is for, and the two commands that prove it works.

## Scaffold

In an empty directory named after the Uplink, run `new`. It writes into that directory, and takes the id from the directory's name unless you give one.

```bash
mkdir example && cd example
npx @ksp-gonogo/uplink-tools@rc new
```

On a terminal it asks what it was not told. Each question is also a flag, so this asks nothing:

```bash
npx @ksp-gonogo/uplink-tools@rc new example --name Example --author "Your Name" \
  --repo you/example --topics own --no-workflows --no-ksp
```

| Question | Flag | When you do not answer |
| --- | --- | --- |
| The id | `<id>` | the directory's name, when it is a valid id |
| The display name | `--name <name>` | the id, capitalised |
| Who wrote it | `--author <name>` | git's `user.name` |
| The GitHub repository it is published from | `--repo <owner>/<name>` or `--no-repo` | this directory's GitHub remote; otherwise a placeholder [`release` refuses](/guide/release#hosting-the-client) |
| Whether it publishes Topics of its own | `--topics own` or `--topics core` | `own` |
| A GitHub Actions workflow | `--workflows` or `--no-workflows` | none |
| Your KSP install | `--ksp <path>` or `--no-ksp` | Steam's install, when there is one |

`--yes` takes the default for every question not answered by a flag. With no terminal and no `--yes`, `new` writes nothing and names each flag it is missing.

- **The id** names the Uplink everywhere: lower-case letters and digits, 2 to 30 of them, starting with a letter. It prefixes the Topics (`example.heartbeat`), the widget ids (`example-heartbeat`) and the C# names: the namespace and assembly are `Gonogo` + the id capitalised + `Uplink` (`GonogoExampleUplink`), and the plugin class is the id capitalised + `Uplink` (`ExampleUplink`). Choose one no other Uplink a player might install is likely to use
- **The author** is shown to the operator when the app asks whether to load your client
- **`--repo`** sets where the released client bundle is fetched from ([Releasing and installing](/guide/release#hosting-the-client)). `you/example` becomes `https://github.com/you/example` in `uplink.json`
- **`--topics core`** makes an Uplink that publishes nothing of its own: its widget reads one of Gonogo's own Topics, and it has no contract slice. This Guide builds one with Topics of its own
- **`--ksp`** writes your KSP folder into `ksp.local.props`, for a plugin that calls the game ([The plugin class](/guide/plugin#calling-the-game)). It is kept out of git

`new` never overwrites a file. After writing the files it runs four steps: `bake`, `codegen` (which needs the .NET SDK), `npm install` in `client/`, and `npm run page`. A step that fails is reported with the command to run again, and the files stay in place. Its closing message names the next three things to do, starting with the `description` in `client/src/uplink.ts` ([Documenting your Uplink](/guide/documenting)).

## What it writes

```
example/
├── uplink.json                   the Uplink's identity, and where its client is fetched from
├── .gitignore
├── Directory.Build.props         where to find KSP's assemblies, if the plugin needs them
├── Directory.Build.targets         and the message when it cannot
├── mod/                          the plugin
│   ├── ExampleUplink.cs            the plugin class
│   ├── GonogoExampleUplink.csproj
│   ├── GonogoExampleUplink.netkan  the metadata CKAN indexes it from
│   └── Provenance.g.cs, ClientSource.g.cs, ExpectedClientHash.g.cs
│                                   written by bake, never committed
├── mod-contract/                 the contract slice: the Uplink's own wire types
│   ├── ExamplePayloads.cs          the payload of each Topic, the arguments of each command
│   ├── ExampleRtConfig.cs          the Reinforced.Typings configuration codegen runs:
│                                     which of those types it turns into TypeScript
│   └── GonogoExampleUplink.Contract.csproj
├── mod-contract-codegen/         the build codegen runs, never shipped
├── mod-tests/                    the plugin's tests
│   ├── ExampleUplinkTests.cs
│   └── GonogoExampleUplink.Tests.csproj
└── client/                       the client package
    ├── package.json
    ├── tsconfig.json, tsconfig.nodenext.json
    ├── vitest.config.ts            the test runner's settings
    ├── README.md                   the generated page
    ├── gonogo-uplink.json          what the app reads about the client
    ├── docs/widgets.json           a record of each widget
    └── src/
        ├── index.ts                the bundle's entry: imports every registration
        ├── uplink.ts               the client's identity
        ├── topics.ts               the Uplink's Topics, typed
        ├── __generated__/          written by codegen from the contract slice
        ├── test/setup.ts           runs before every test
        ├── Heartbeat/              one widget, its test and its fixture
        └── uplink-page.test.ts     fails when the generated page is out of date
```

The **contract slice** is a small assembly holding the C# classes that describe what goes on the wire: the payload of each Topic and the arguments of each command. The plugin compiles against it, and `codegen` reads it to write the client's TypeScript types, doc comments included, so the two halves describe a payload the same way. [Publishing a Topic](/guide/topics) covers it.

## uplink.json

<<< ../../example/uplink.json

This is the example's, made with `--author "Uplink docs"` and `--repo ksp-gonogo/uplink-dev-docs`; yours holds your own answers. The Uplink's identity, where its plugin and client go, and how codegen runs. [uplink.json](/guide/uplink-json) lists each field and the command that reads it. The version lives in `client/package.json` instead, and two other places repeat it: `UPLINK_VERSION` in `client/src/uplink.ts`, and the version folder in `client.url`.

## Prove it works

```bash
cd client
npm test
dotnet test ../mod-tests
```

`npm test` runs the widget's test and the page check, which fails when `README.md`, `gonogo-uplink.json` or `docs/widgets.json` no longer describe what the client registers; it ends with every test file passed. `dotnet test` builds the plugin and runs its tests with no game, constructing the plugin class and calling it directly, and ends `Passed!` with the count.

## What to commit

Everything except what `.gitignore` names: `node_modules`, the build outputs, `ksp.local.props`, and the three `*.g.cs` files `bake` writes into `mod/`, of which `ClientSource.g.cs` can hold a path on the machine that baked it (`DevPath`). Commit `client/src/__generated__/`, the generated page files and `package-lock.json`: a reader of your repository, and CI, use them without running the generators.

## The heartbeat

The scaffold's plugin publishes one Topic, `example.heartbeat`, carrying a count of how many times it has published and the game time of the last sample. Its widget shows both. The next four pages take the plugin apart, and the four after them the client.

## What is left to change by hand

The heartbeat is a placeholder for your own Topics and widgets, and `new` writes it in several places that nothing renames for you. When you build your own, change or remove each:

- **The `description`** in `client/src/uplink.ts`, which the closing message names
- **The heartbeat widget**: `client/src/Heartbeat/`, with its test `index.test.tsx` and its fixture `__fixtures__/beating.json`, and the two lines of `client/src/index.ts` that import and export it
- **Every `<id>.heartbeat` reference**: `HeartbeatTopic` and its channel and source in `mod/<Id>Uplink.cs`, the payload class in `mod-contract/<Id>Payloads.cs`, its entry in the wire types of `mod-contract/<Id>RtConfig.cs`, its line in the `declare module` block of `client/src/topics.ts` and that file's example comment, and the test in `mod-tests/<Id>UplinkTests.cs` that names it
- **The netkan** `mod/<GameData name>.netkan`: its `abstract` describes the heartbeat, and its `depends` names only `GonogoCore`, so add the mod you wrap ([Wrapping a mod](/guide/wrapping-a-mod#by-a-compile-time-reference)); its `license` is `MIT` until you change it
- **`"mod": null`** in `uplink.json`, which names the mod you wrap, if any ([Wrapping a mod](/guide/wrapping-a-mod#in-uplink-json))

`npm test` and `dotnet test ../mod-tests` both pass on what `new` wrote, so run them after each change: a code reference left behind fails to compile or fails a test. The netkan, the description and `uplink.json` fail nothing when left as they are, so read them over before a release.

Next: [The plugin class](/guide/plugin).
