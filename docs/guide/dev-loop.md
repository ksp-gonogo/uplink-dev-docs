# See your Uplink in the app

You can watch a client you are building inside the app, with a rebuild on every save, without releasing anything. There are two ways, depending on whether you have a checkout of the Gonogo app.

## With a checkout of the app

::: warning What this needs
- A checkout of the Gonogo app ([github.com/ksp-gonogo/gonogo](https://github.com/ksp-gonogo/gonogo), its `staging` branch, which is what the release candidate is built from), installed once with `pnpm install` (pnpm 10, with Node). The dev server is part of the app's source, so this way does not run against the hosted app; [Without a checkout](#without-a-checkout) does
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

The path is your Uplink's directory, the one holding `uplink.json`. Repeat `--uplink` for more than one Uplink, and `pnpm dev --help` prints the options. An Uplink without an `uplink.json` is refused, and so is a path that is not a directory.

The app loads each one's build output from `client/dist/<id>/`, with no report from the mod, no hash comparison and no consent prompt. It still checks the bundle's contract (the SDK and ui-kit versions it was built against) and the bytes it fetched, and it reloads the page on every rebuild.

An Uplink that ships inside the app's own repository needs no `--uplink`: `pnpm dev` builds those from source when it starts. Naming one without an `uplink.json` of its own is refused with that explanation. Naming one that has its own `uplink.json` replaces the bundled copy of the same id with yours.

## The options of the two commands

`bundle` takes `--client <dir>` for the client package (the current directory by default), `--entry <file>` for the module to bundle (`src/index.ts`), and `--out <dir>` for the output root (`<client>/dist`), where the bundle lands in `<out>/<id>/<id>.client.js`. `bake` takes `--bundle <file>`, the built bundle to hash, and `--dev-path <url>`, which [Without a checkout](#without-a-checkout) uses. Both answer `--help` with the full text.

## What Settings shows

Open Settings, then Uplinks. A **Local builds** tab leads the row of tabs, with one row per Uplink you named: its name, a `Local` badge, the version, when it was built, where it came from, and one line saying what became of it, in the form `Client: <state> · mod: <state>`. Your Uplink's own tab carries `(local)` after its name and the same line in its Status section.

| The line says | What it means |
|---|---|
| `Client: loaded` | The bundle passed its checks and registered its widgets |
| `Client: quarantined: <reason>` | The app refused it. The reason names the check, usually a contract or API version the bundle was built against that this app does not speak, or a hash that does not match the bytes served |
| `Client: waiting for the first build` | The watch build has not produced a bundle yet, or is not running |
| `Client: not loaded yet` | A bundle exists and the app has not finished loading it |
| `Client: build failed: <message>` | The last save did not compile. This is the first line of the error, and the last good build is still the one loaded |
| `mod: reporting, v<version>` | KSP is connected and lists your Uplink |
| `mod: not reporting <id>` | KSP does not list it, so a widget will have no data. It still loads, so you can work on layout without the game |

The **Reload** button on a row reloads the page when you want to pick up a build yourself.

## Without a checkout

Against an app that is already running, build the plugin once with a development URL, then serve the client from your computer:

```bash
npx uplink-tools bake --dev-path http://localhost:5173/example.client.js
npx uplink-tools bundle --serve 5173
```

`--serve` watches like `--watch` and serves the bundle and its sidecar at `http://localhost:<port>/<id>.client.js`. The app loads a client from a `localhost` address with no hash to check and says on screen that it is an unvouched development client. [Releasing and installing](/guide/release#trying-a-client-before-you-publish-it) has the whole sequence, and why a plugin baked this way is never one to release.

## When it does not work

- **Nothing under Local builds.** The tab appears only when the dev server was started with `--uplink`. Check the path holds an `uplink.json`, and read the server's startup output for the error
- **`waiting for the first build` that never ends.** The watch build is not running in that client, or it writes somewhere else. The bundle must land in `dist/<id>/` under the client
- **`quarantined`, and the reason names a version.** The bundle was built against a different SDK or ui-kit than this checkout. Update the one that is behind (`npm install @ksp-gonogo/sitrep-sdk@rc @ksp-gonogo/ui-kit@rc` in `client/`, or `git pull` and `pnpm install` in the checkout) and rebuild
- **`build failed`.** Fix the error the line quotes. The page keeps running the last good build in the meantime
- **Loaded, and the widget shows nothing.** Check the `mod:` half of the line: a widget cannot show data from a mod KSP does not list

Next: [Testing](/guide/testing).
