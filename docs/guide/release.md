# Releasing and installing

A release is two artifacts: a zip of the plugin, which a player installs into KSP, and the client bundle, which you host and the app fetches. This page covers building both, putting them where they belong, and how the app comes to load your client.

## Build both halves

```bash
cd client
npm run release
```

`release` runs five steps, in an order that matters:

1. **Bundle** the client into `client/dist/example/example.client.js`, with `gonogo-uplink.json` beside it
2. **Bake** into the plugin's generated files where the bundle will be hosted and the bundle's hash
3. **Compile** the plugin in Release
4. **Check** that the compiled plugin carries the URL and hash that were baked
5. **Package** the plugin as `dist/GonogoExampleUplink.zip`, holding `GonogoExampleUplink/Plugins/` with the plugin and its contract slice, and nothing else

The app loads a client only when the plugin vouches for the exact bundle it fetched, so the bundle must be built and hashed before the plugin is compiled. A plugin compiled first builds and passes its tests, and the app shows none of its widgets. `release` refuses to run while `client.url` in `uplink.json` is still the placeholder `new` writes without `--repo`.

## How the app loads a client

When the app connects to the game, the Gonogo mod tells it which Uplinks are installed, and for each one the client's URL, its name, author and repository, and the bundle's hash, all from what `bake` wrote into the plugin. The app asks the operator whether to load each new client, showing who made it. With their yes, it fetches the bundle and `gonogo-uplink.json` beside it, checks the bundle against the hash the plugin vouched for, and loads it. A bundle that does not match is refused.

So a player needs only your plugin installed: the client follows from it.

## Hosting the client

`client.url` in `uplink.json` is where the app fetches the bundle. With `--repo you/example`, `new` points it at jsDelivr, which serves files from a GitHub repository:

```
https://cdn.jsdelivr.net/gh/you/example@releases/releases/example/0.0.1/example.client.js
```

That is the file `releases/example/0.0.1/example.client.js` on your repository's `releases` branch. To publish, copy `example.client.js` and `gonogo-uplink.json` from `client/dist/example/` into that folder on that branch, and push. Keep `gonogo-uplink.json` beside the bundle under exactly that name: the app finds it from the bundle's own URL. Any other host that serves files over HTTPS works too: put its URL in `client.url` before running `release`.

Published files must never change, since the plugin vouches for one exact bundle. A new release is a new version folder.

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

Never put it inside `GameData/Gonogo/`, and never add a copy of `Sitrep.Contract.dll`: the Gonogo mod provides it. Start the game and connect the app. Your Uplink is loaded when its Topics carry data; a successful load writes nothing to `KSP.log`.

## Trying a client before you publish it

To load a client from your own machine, bake a development URL into the plugin:

```bash
npx uplink-tools release --dev-path http://localhost:8000/example/example.client.js
```

Serve `client/dist/` at that URL, with cross-origin requests allowed, since the app's page fetches the bundle from another origin. The app prefers a development URL over the released one, so `release` does not zip a development build: copy the two `.dll` files from `mod/bin/Release/` into `GameData/GonogoExampleUplink/Plugins/` yourself, and never publish them.

The app still checks the bundle against the hash baked into the plugin, so after each change to the client, run the same command again and copy the new plugin in, then restart the game. Between those, `npm test` and `npm run render` show the widget without the game.

## CKAN and SpaceDock

`new` writes `mod/GonogoExampleUplink.netkan`, the metadata CKAN indexes a mod from, naming `GonogoCore` as a dependency. Submitting it follows CKAN's own process:

- [CKAN's guide to adding a mod](https://github.com/KSP-CKAN/CKAN/wiki/Adding-a-mod-to-the-CKAN)
- [SpaceDock](https://spacedock.info/), which hosts a mod's zip and which CKAN can index from

If your Uplink integrates another mod, add it to the netkan's `depends` (or `recommends`, when the Uplink is useful without it).

Next: [Concepts](/guide/concepts).
