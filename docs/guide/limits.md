# Known limits

What the published packages do not do, so you find out here rather than three days in.

## Your client cannot mount inside the dashboard

`@ksp-gonogo/sitrep-sdk@0.0.1` publishes the wire contract: message envelopes, Topic names, payload types, and `parseServerMessage`. It publishes no registration API, no React hooks, and no dashboard host, and its `exports` map has a single entry, so the `/frames`, `/media` and `/testing` subpaths documented elsewhere do not resolve.

You can build the plugin half completely, and a browser client that opens the stream itself and renders anywhere you host it, including alongside KSP on the same machine or on a second screen. You cannot register a widget into the Gonogo dashboard, because the API that does so is not published to npm.

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

## You cannot publish a type of your own

The mod's serialiser writes dictionaries, arrays, strings, numbers, booleans, and the payload types the mod itself declares. There is no reflection over an arbitrary object, and no extension point for one.

So your payloads are `Dictionary<string, object?>`, built by hand, with enums cast to their integer values. The compiler cannot help, because `IChannelPublisher.Publish` takes `object?`.

**The failure is silent.** A frame the serialiser cannot write is dropped. The client's subscribe is acknowledged and then nothing ever arrives, which is indistinguishable from a Topic that has not changed.

## No generated types for your own Topics

The SDK's typed Topic map is generated from the Gonogo mod's own contract. Your Uplink's payloads are not in it and nothing generates them, so the C# class and the TypeScript interface are two hand-written declarations of one shape, and nothing checks that they agree.

Keep them in one file each, next to each other in the repository, and change them together.

## The SDK and the contract assembly have drifted apart

They are published on different schedules and are not in step. `CommandErrorCode` is the measurable case: the contract assembly declares 22 members, the published SDK declares the first 7. A plugin returning `InsufficientFunds` sends a number the client's enum cannot name.

Treat the SDK's generated types as a floor rather than a description of the mod you are talking to, and handle a value you do not recognise.

## The client message union is incomplete

`ClientMessage` covers `subscribe`, `unsubscribe` and `command-request`. The server also accepts `set-vantage`, which the union does not include, so sending it means stepping outside the SDK's type.

## Command results are untyped end to end

`command-response.result` is `unknown`. The command name does not imply a result type in either direction, so every caller casts. Declare one result interface per command and cast in one place.

## The Gonogo mod is not released

Not on CKAN, not on SpaceDock, no download. The only way to get it, and therefore the only way to get `Sitrep.Contract.dll`, is to build it from source.

That has two knock-on effects. There is no CKAN identifier your Uplink can declare a dependency on, so nothing stops a player installing your Uplink without the assembly it needs. And the copy you compile against is whatever your build produced, with no way to pin a contract version in your project file or state which one your Uplink needs. Record what you built against in your README.

## Command handlers do not run on the main thread

And `Sitrep.Contract` provides no way to get onto it. A handler that must call the game records the request for the next main-thread capture to apply, as the [command page](/guide/commands) shows. There is no supported way to make a handler's return value depend on a game call.
