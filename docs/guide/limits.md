# Known limits

What the published packages do not do, so you find out here rather than three days in.

## Your client cannot mount inside the dashboard

`@ksp-gonogo/sitrep-sdk@0.0.1` publishes the wire contract: message envelopes, Topic names, payload types, and `parseServerMessage`. It publishes no registration API, no React hooks, and no dashboard host, and its `exports` map has a single entry, so the `/frames`, `/media` and `/testing` subpaths documented elsewhere do not resolve.

You can build the plugin half completely, and a browser client that opens the stream itself and renders anywhere you host it. You cannot register a widget into the Gonogo dashboard from the registry, because the API to do so is not on it.

## Neither package loads under Node

Both ship ESM with extensionless relative imports, which a bundler resolves and Node does not:

```
node -e 'import("@ksp-gonogo/ui-kit")'
ERR_MODULE_NOT_FOUND: Cannot find module '.../dist/ActionButton'
```

Vite, webpack, esbuild and Rollup are unaffected. A Node-based test runner needs the packages inlined into its transform pipeline: in Vitest, `server.deps.inline`.

## React 19 will not install

`@ksp-gonogo/ui-kit@0.1.0` declares `react@^18` as its peer dependency, so `npm install` fails with `ERESOLVE` against React 19. Pin React 18.

Under a strict package manager, ui-kit also cannot typecheck alone: one of its declaration files imports a type from `@ksp-gonogo/sitrep-sdk`, which it lists only as a dev dependency. Install both packages, which you want anyway.

## No generated types for your own Topics

The SDK's typed Topic map is generated from the Gonogo mod's own contract. Your Uplink's payloads are not in it and nothing generates them, so the C# class and the TypeScript interface are two hand-written declarations of one shape, and nothing checks that they agree.

Keep them in one file each, next to each other in the repository, and change them together.

## The client message union is incomplete

`ClientMessage` covers `subscribe`, `unsubscribe` and `command-request`. The server also accepts `set-vantage`, which the union does not include, so sending it means stepping outside the SDK's type.

## Command results are untyped end to end

`command-response.result` is `unknown`. The command name does not imply a result type in either direction, so every caller casts. Declare one result interface per command and cast in one place.

## `Sitrep.Contract.dll` has no versioned distribution

It is not on NuGet. The copy you compile against is the one in the KSP install you happen to have, so there is no way to pin a contract version in your project file or to state which one your Uplink needs. Record the Gonogo mod version you built against in your README.

## Command handlers do not run on the main thread

And `Sitrep.Contract` provides no way to get onto it. A handler that must call the game records the request for the next main-thread capture to apply, as the [command page](/guide/commands) shows. There is no supported way to make a handler's return value depend on a game call.
