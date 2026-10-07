# Releasing and installing

A release is two artifacts: a zip of the plugin, which a player installs into KSP, and the client bundle, which you host and the app fetches. This page covers building both, putting them where they belong, and how the app comes to load your client.

## Build both halves

From `client/`:

```bash
npm run release
```

`release` runs five steps, in an order that matters:

1. **Bundle** the client into `client/dist/example/example.client.js`, with `gonogo-uplink.json` beside it
2. **Bake** into the plugin's generated files where the bundle will be hosted and the bundle's hash, a SHA-256 written `sha256-<hex>`
3. **Compile** the plugin in Release
4. **Check** that the compiled plugin carries the URL and hash that were baked
5. **Package** the plugin as `dist/GonogoExampleUplink.zip`, holding `GonogoExampleUplink/Plugins/` with the plugin and its contract slice, and nothing else

The app loads a client only when the plugin vouches for the exact bundle it fetched, so the bundle must be built and hashed before the plugin is compiled. A plugin compiled first builds and passes its tests, and the app shows none of its widgets. `release` refuses to run while `client.url` in `uplink.json` is still the placeholder `new` writes without a repository.

## How the app loads a client

When the app connects to the game, the Gonogo mod tells it which Uplinks are installed, and for each one the client's URL, its name, author and repository, and the bundle's hash, all from what `bake` wrote into the plugin. The app asks the operator whether to load each new client, showing who made it. With their yes, it fetches the bundle and `gonogo-uplink.json` beside it, checks the bundle against the hash the plugin vouched for, and loads it. A bundle that does not match is refused.

So a player needs only your plugin installed: the client follows from it.

## Hosting the client

`client.url` in `uplink.json` is where the app fetches the bundle. With `--repo you/example`, `new` points it at jsDelivr, which serves files from a GitHub repository:

```
https://cdn.jsdelivr.net/gh/you/example@releases/releases/example/0.0.1/example.client.js
```

That is the file `releases/example/0.0.1/example.client.js` on your repository's `releases` branch. To publish the first version, from the Uplink's folder, with git 2.42 or later:

```bash
git worktree add --orphan -b releases ../example-releases
mkdir -p ../example-releases/releases/example/0.0.1
cp client/dist/example/example.client.js client/dist/example/gonogo-uplink.json ../example-releases/releases/example/0.0.1/
cd ../example-releases
git add releases && git commit -m "Release example 0.0.1" && git push -u origin releases
```

For a later version, `git worktree add ../example-releases releases` checks the branch out again, and the files go in that version's folder. Keep `gonogo-uplink.json` beside the bundle under exactly that name: the app finds it from the bundle's own URL.

Never change a published file. The plugin vouches for one exact bundle, and jsDelivr keeps serving what it first fetched from a path; a new release is a new version folder. Any other host that serves files over HTTPS works too: put its URL in `client.url` before running `release`.

## A new version

The version is in three places, all changed together:

- `version` in `client/package.json`, which `bake` writes into the plugin
- `UPLINK_VERSION` in `client/src/uplink.ts`
- The version folder in `client.url` in `uplink.json`

Then run `npm run page`, since the page records the version, and `npm run release`.

## Installing

Unzip `dist/GonogoExampleUplink.zip` into the game's `GameData/` folder:

```
KSP/GameData/GonogoExampleUplink/Plugins/GonogoExampleUplink.dll
KSP/GameData/GonogoExampleUplink/Plugins/GonogoExampleUplink.Contract.dll
```

Never put it inside `GameData/Gonogo/`, and never add a copy of `Sitrep.Contract.dll`: the Gonogo mod provides it. Start the game and connect the app ([Start here](/guide/#what-else-you-need) says where to get both).

## Checking it loaded

A successful load writes nothing to `KSP.log`, so look for the Uplink's data: add its widget in the app, and it shows a value once the game is running a save. Two failures do write a line, marked `[ChannelEngine]`:

```
uplink "example" marked UNAVAILABLE: registration threw: <message>
uplink "example" marked UNAVAILABLE: capability declaration threw: <message>
```

An Uplink that reports itself unavailable or degraded, through `Health` or `SetAvailability`, has its reason drawn in its widget's place in the app. A class with no public constructor with no parameters is never constructed, and nothing says so: check that first when an Uplink is silent.

## Trying a client before you publish it

To load a client from your own machine, bake a development URL into the plugin. From `client/`:

```bash
npx uplink-tools release --dev-path http://localhost:8000/example/example.client.js
npx http-server dist -p 8000 --cors
```

The second command serves `client/dist/` at that URL, allowing the cross-origin requests the app's page makes. The app prefers a development URL over the released one, so `release` does not zip a development build: copy the two `.dll` files from `mod/bin/Release/` into `GameData/GonogoExampleUplink/Plugins/` yourself, and never publish them.

The app still checks the bundle against the hash baked into the plugin, so after each change to the client, run the `release` command again, copy the new plugin in, and restart the game. Between those, `npm test` and `npm run render` show the widget without the game.

## CKAN and SpaceDock

`new` writes `mod/GonogoExampleUplink.netkan`, the metadata CKAN indexes a mod from, naming `GonogoCore`, the Gonogo mod's CKAN identifier, as a dependency. Before submitting it, change its `install` entry's `file` to `GonogoExampleUplink`, the folder at the top of the zip: the `GameData/GonogoExampleUplink` it is written with is not a path inside the zip, and CKAN would find nothing to install.

If your Uplink integrates another mod, add that mod to the netkan's `depends` (or `recommends`, when the Uplink is useful without it). Submitting follows CKAN's own process:

- [CKAN's guide to adding a mod](https://github.com/KSP-CKAN/CKAN/wiki/Adding-a-mod-to-the-CKAN)
- [SpaceDock](https://spacedock.info/), which hosts a mod's zip and which CKAN can index from

Next: [Concepts](/guide/concepts).
