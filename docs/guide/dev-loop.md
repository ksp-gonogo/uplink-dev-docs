# See your Uplink in the app

You can watch a client you are building inside the app, with a rebuild on every save, without releasing anything. There are two ways, depending on whether you have a checkout of the Gonogo app: [with a checkout](#with-a-checkout-of-the-app) you run the app from its source and it loads your build directly, and [without one](#without-a-checkout) you use the hosted app and serve your client from your own computer. Either way, the app's page reloads on its own (with a checkout) or you reload it yourself (without).

Both ways need the Gonogo mod in KSP and a plugin built for development ([Start here](/guide/#what-else-you-need) says where to get the mod); the app is the only part that differs.

The loop in short, with a checkout: start the watch build, leave it running, start the app with your Uplink named, and read the **Local builds** tab in Settings to see what became of it. Edit, save, and the page reloads with the new build.

## With a checkout of the app

::: warning What this needs
- A checkout of the Gonogo app, installed once. This needs git and pnpm 10 ([Prerequisites](/guide/prerequisites#tools)):
  ```bash
  git clone --branch staging https://github.com/ksp-gonogo/gonogo.git
  cd gonogo
  pnpm install
  ```
  `staging` is the branch the release candidate is built from. The dev server is part of the app's source, so this way does not run against the hosted app; [Without a checkout](#without-a-checkout) does
- For live data, your plugin installed in KSP and the game running. Without it the widgets still render, with nothing to show
:::

Use two terminals. In your Uplink's `client/`, start the watch build:

```bash
npx uplink-tools bundle --watch
```

It builds once, then rebuilds each time a source file changes. A failed rebuild leaves the last good bundle in place, and the state (waiting, built or failed) is written to `watch-status.json` beside the bundle. Stop it with Ctrl-C.

In the app checkout, start the app and name your Uplink:

```bash
pnpm dev --uplink ~/projects/example
```

The path is your Uplink's directory, the one holding `uplink.json`, and a relative path is read from where you typed the command. Repeat `--uplink` for more than one Uplink, and `pnpm dev --help` prints the options. Everything else `pnpm dev` starts starts as it does without the flag, including the relay, the small server in the app's source that the app uses to set up connections between the main screen and its stations. An Uplink without an `uplink.json` is refused, and so is a path that is not a directory.

The app loads each one's build output from `client/dist/<id>/`, without waiting for the mod to list your Uplink, with no hash comparison and no consent prompt. It still checks the bundle's contract (the SDK and ui-kit versions it was built against) and the bytes it fetched, and it reloads the page on every rebuild.

If you name an Uplink whose id is also one that ships inside the app, yours replaces that copy in the app's index and in Settings, so the build you are working on is the one that loads.

## The options of the two commands

`bundle` takes `--client <dir>` for the client package (the current directory by default), `--entry <file>` for the module to bundle (`src/index.ts`), and `--out <dir>` for the output root (`<client>/dist`), where the bundle lands in `<out>/<id>/<id>.client.js`. `bake` takes `--bundle <file>`, the built bundle to hash, and `--dev-path <url>`, which [Without a checkout](#without-a-checkout) uses. Both answer `--help` with the full text.

## What Settings shows

Open Settings, then Uplinks. A **Local builds** tab leads the row of tabs, with one row per Uplink you named: its name, a `Local` badge, the version, when it was built, where it came from, and one line saying what became of it, in the form `Client: <state> · mod: <state>`. Your Uplink's own tab carries `(local)` after its name and the same line in its Status section.

| The line says | What it means |
|---|---|
| `Client: loaded` | The bundle passed its checks and registered its widgets |
| `Client: quarantined: <reason>` | The app refused it. The reason names the check, usually a contract or API version the bundle was built against that this app does not speak, or, for an Uplink installed from a release rather than built from your checkout, a hash that does not match the bytes served |
| `Client: waiting for the first build, run the Uplink's watch build` | The watch build has not produced a bundle yet, or is not running |
| `Client: not loaded yet` | A bundle exists and the app has not finished loading it |
| `Client: build failed: <message>` | The last save did not compile. This is the first line of the error. When a build had loaded before, the line ends `, the last good build is loaded` and that is the one running |
| `mod: reporting, v<version>` | KSP is connected and lists your Uplink |
| `mod: not reporting <id>` | KSP does not list it, so a widget will have no data. It still loads, so you can work on layout without the game |

The **Reload** button on a row reloads the page when you want to pick up a build yourself.

## Without a checkout

Against an app that is already running, such as the hosted [`/rc/` app](https://ksp-gonogo.github.io/rc/), build the plugin once with a development URL, then serve the client from your computer:

```bash
npx uplink-tools bake --dev-path http://localhost:5173/example.client.js
dotnet build ../mod -c Release
npx uplink-tools bundle --serve 5173
```

`bake` writes the development URL into the plugin's sources, so build the plugin after it and copy its two `.dll` files, `GonogoExampleUplink.dll` and `GonogoExampleUplink.Contract.dll`, from `mod/bin/Release/` into `GameData/GonogoExampleUplink/Plugins/` ([Releasing and installing](/guide/release#trying-a-client-before-you-publish-it) shows the whole sequence); `bundle --serve` then serves the client the plugin points at.

`--serve` watches like `--watch` and serves the bundle and its sidecar at `http://localhost:<port>/<id>.client.js`. The app loads a client from a `localhost` address with no hash to check and says on screen that it is an unvouched development client. [Releasing and installing](/guide/release#trying-a-client-before-you-publish-it) has the whole sequence, and why a plugin baked this way is never one to release.

## When it does not work

- **Nothing under Local builds.** The tab appears only when the dev server was started with `--uplink`. Check the path holds an `uplink.json`, and read the server's startup output for the error
- **`waiting for the first build` that never ends.** The watch build is not running in that client, or it writes somewhere else. The bundle must land in `dist/<id>/` under the client
- **`quarantined`, and the reason names a version.** The bundle was built against a different SDK or ui-kit than this checkout. Update the one that is behind (`npm install @ksp-gonogo/sitrep-sdk@rc @ksp-gonogo/ui-kit@rc` in `client/`, or `git pull` and `pnpm install` in the checkout) and rebuild
- **`build failed`.** Fix the error the line quotes. The page keeps running the last good build in the meantime
- **Loaded, and the widget shows nothing.** Check the `mod:` half of the line: a widget cannot show data from a mod KSP does not list

Next: [Testing](/guide/testing).
