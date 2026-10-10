# Releasing and installing

A release is two artifacts: a zip of the plugin, which a player installs into KSP, and the client bundle, which you host and the app fetches. This page covers building both, putting them where they belong, and how the app comes to load your client.

## Build both halves

From `client/`:

```bash
npm run release
```

`release` runs five steps, in an order that matters:

1. **Bundle** (`uplink-tools bundle`) the client into `client/dist/example/example.client.js` (the `dist/` inside `client/`), with `gonogo-uplink.json` beside it
2. **Bake** (`uplink-tools bake`) into the plugin's generated files where the bundle will be hosted and the bundle's hash, a SHA-256 written `sha256-<hex>`
3. **Compile** the plugin in Release
4. **Check** that the compiled plugin carries the URL and hash that were baked
5. **Package** (`uplink-tools package`) the plugin as `dist/GonogoExampleUplink.zip` in the Uplink's own folder, beside `client/` and not inside it, holding `GameData/GonogoExampleUplink/Plugins/` with the plugin and its contract slice, and nothing else, with the netkan beside it

The app loads a client only when the plugin vouches for the exact bundle it fetched, so the bundle must be built and hashed before the plugin is compiled. A plugin compiled first builds and passes its tests, and the app shows none of its widgets. `release` refuses to run while `client.url` in `uplink.json` is still the placeholder `new` writes without a repository, and while the version's three places disagree ([A new version](#a-new-version)).

The `gonogo-uplink.json` to publish is the one `release` writes beside the bundle in `client/dist/example/`, which carries the bundle's hash as its `integrity`. The one committed beside the client, which `npm run page` and `npm run docs` write, has an empty `integrity` until a hash is stamped into it, and `page` and `docs` leave a stamped one alone. An empty one is right for a working copy and refused by the app if published, so publish from `dist/`.

## How the app loads a client

When the app connects to the game, the Gonogo mod tells it which Uplinks are installed, and for each one the client's URL, its name, author and repository, and the bundle's hash, all from what `bake` wrote into the plugin. The app asks the operator whether to load each new client, showing who made it. With their yes, it fetches the bundle and `gonogo-uplink.json` beside it, checks the bundle against the hash the plugin vouched for, and loads it. A bundle that does not match is refused.

So a player needs only your plugin installed: the client follows from it.

## Hosting the client

`client.url` in `uplink.json` is where the app fetches the bundle. With `--repo acme/example`, `new` points it at jsDelivr, which serves files from a GitHub repository:

```
https://cdn.jsdelivr.net/gh/acme/example@releases/releases/example/0.0.1/example.client.js
```

That is the file `releases/example/0.0.1/example.client.js` on your repository's `releases` branch. To publish the first version, from the Uplink's folder, with git 2.42 or later (the folder must be a git repository with at least one commit and an `origin` remote; run `git init`, commit and add the remote first if it is not):

```bash
git worktree add --orphan -b releases ../example-releases
mkdir -p ../example-releases/releases/example/0.0.1
cp client/dist/example/example.client.js client/dist/example/gonogo-uplink.json ../example-releases/releases/example/0.0.1/
cd ../example-releases
git add releases && git commit -m "Release example 0.0.1" && git push -u origin releases
```

In PowerShell, `mkdir -p` and `cp` are `New-Item -ItemType Directory -Force` and `Copy-Item` ([Known limits](/guide/limits#the-tools)). For a later version, `git worktree add ../example-releases releases` checks the branch out again, and the files go in that version's folder. Keep `gonogo-uplink.json` beside the bundle under exactly that name: the app finds it from the bundle's own URL.

`new` writes this URL only when it knows the repository, from `--repo` or this directory's GitHub remote. With `--no-repo`, or an owner named `you`, it writes a placeholder, and `release` refuses to run until you set `repo` and `client.url` in `uplink.json` to where the bundle will really be published ([uplink.json](/guide/uplink-json#what-release-refuses)).

Never change a published file. The plugin vouches for one exact bundle, and jsDelivr keeps serving what it first fetched from a path; a new release is a new version folder. Any other host that serves files over HTTPS works too: put its URL in `client.url` before running `release`.

## A new version

The version is in three places, all changed together, and `release` refuses while they disagree:

- `version` in `client/package.json`, which `bake` writes into the plugin
- `UPLINK_VERSION` in `client/src/uplink.ts`
- The version folder in `client.url` in `uplink.json`

Then run `npm run page`, since the page records the version, and `npm run release`.

## Installing

The zip holds the `GameData` folder, so unzip `dist/GonogoExampleUplink.zip` into the KSP folder that holds `GameData`:

```
KSP/GameData/GonogoExampleUplink/Plugins/GonogoExampleUplink.dll
KSP/GameData/GonogoExampleUplink/Plugins/GonogoExampleUplink.Contract.dll
```

Never put it inside `GameData/Gonogo/`, and never add a copy of `Sitrep.Contract.dll`: the Gonogo mod provides it. Start the game and connect the app ([Start here](/guide/#what-else-you-need) says where to get both). With KSP on the same computer the app connects to `localhost` on port 8090 with nothing to set; for another computer, set its address in the app's **Settings**, **Connection** tab, **Telemetry stream** row ([Connecting the dashboard to KSP](https://github.com/ksp-gonogo/gonogo/blob/main/docs/KSP-SETUP.md#connecting-the-dashboard-to-ksp)).

## Checking it loaded

A successful load writes nothing to `KSP.log`, so look for the Uplink's data: add its widget in the app, and it shows a value once the game is running a save. Two failures do write a line, marked `[ChannelEngine]`:

```
uplink "example" marked UNAVAILABLE: registration threw: <message>
uplink "example" marked UNAVAILABLE: capability declaration threw: <message>
```

An Uplink that reports itself unavailable or degraded, through `Health` or `SetAvailability`, has its reason drawn in its widget's place in the app. A class with no public constructor with no parameters is never constructed, and nothing says so: check that first when an Uplink is silent.

## Trying a client before you publish it

While you work on the client, the app can load it straight from your machine, with no hash and no rebuild of the plugin after each change. Build the plugin once with a development URL and no bundle, from `client/`:

```bash
npx uplink-tools bake --dev-path http://localhost:8000/example.client.js
dotnet build ../mod -c Release
```

Copy the two `.dll` files from `mod/bin/Release/` into `GameData/GonogoExampleUplink/Plugins/`, start the game, and leave the plugin there. Then serve the client:

```bash
npm run bundle -- --serve 8000
```

It rebuilds the bundle on every save and serves it at the URL you baked. Edit, save, and reload the app's page to load the new client.

A plugin with a development URL and no hash vouches for nothing, so the app loads its client unchecked, and only from `localhost`: each of its widgets says "Unvouched development client" on its panel, and the Uplink's status page says why. A station takes its clients from the main screen, which never passes on an unvouched one. Before releasing, rebuild with `npm run release`, which bakes the released URL and the bundle's hash: a plugin built for development is never one to install anywhere but your own machine. `release --dev-path` still bakes the bundle's hash, so it is not the loop above, and it does not zip what it builds.

## CKAN and SpaceDock

`release` writes `dist/GonogoExampleUplink.netkan` beside the zip: the metadata CKAN indexes a mod from, naming `GonogoCore`, the Gonogo mod's CKAN identifier, as a dependency, and installing the zip's `GameData/GonogoExampleUplink` folder. If your Uplink integrates another mod, add that mod to `mod/GonogoExampleUplink.netkan`'s `depends` (or `recommends`, when the Uplink is useful without it).

The netkan `new` writes has no `$kref`, the line telling CKAN where each release's zip is downloaded from, and CKAN needs one. Attach the zip to a release on your repository and add `"$kref": "#/ckan/github/<owner>/<repo>"`, or upload it to SpaceDock and add `"$kref": "#/ckan/spacedock/<mod id>"`. Submitting follows CKAN's own process:

- [CKAN's guide to adding a mod](https://github.com/KSP-CKAN/CKAN/wiki/Adding-a-mod-to-the-CKAN)
- [SpaceDock](https://spacedock.info/), which hosts a mod's zip and which CKAN can index from

Next: [uplink.json](/guide/uplink-json).
