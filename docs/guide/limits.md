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

## The tarball on npm is behind the kit these pages document

These pages describe the `@ksp-gonogo/ui-kit` the built-in screens are made of, because that is the kit you will be building against and the shape worth writing. The tarball currently sitting on npm as `0.1.0` predates a good deal of it, and the gap is wide enough to bite on the first widget.

`Panel` is the clearest instance. Here it is a compound component that takes its title, its body sections, its header aside, its toolbar and its sidebar as props, and decides from the tile's own width whether those sections run down one column or across two. On npm it is a styled `div` with bare `PanelTitle` and `PanelSubtitle` beside it, and `panelTitle` and `sections` are type errors against it.

Write the shape these pages document. The older one still renders, but it gets the unpadded passthrough and a body that never reflows, so a widget written to it has to be rewritten rather than merely rebuilt. The fix for the gap is a republish.

## You cannot declare a unit of your own

In the SDK these pages document, an Uplink declares a unit by merging an entry into the SDK's `UnitDeclarations` interface, giving the unit's kind, dimension, ratio and optional ladder, and registers it once with `registerUnit`. The kit reads those declarations for every unit check it makes, so a declared unit is held to the same rules as a built-in one.

`@ksp-gonogo/sitrep-sdk@0.0.1` and `@ksp-gonogo/ui-kit@0.1.0` on npm predate it, and neither carries a unit declaration or a registration. Until a republish there is no way to teach the client a unit of your own.

## You cannot publish a type of your own

The mod's serialiser writes dictionaries, arrays, strings, numbers, booleans, and the payload types the mod itself declares. There is no reflection over an arbitrary object, and no extension point for one.

So your payloads are `Dictionary<string, object?>`, built by hand. The compiler cannot help, because `IChannelPublisher.Publish` takes `object?`.

**The failure comes at runtime.** The first frame the serialiser cannot write marks your Uplink unavailable, and each subscriber gets an `error` frame with code `payload-serialization-error` naming the type it could not write.

## No generated types for your own Topics

The SDK's typed Topic map is generated from the Gonogo mod's own contract. Your Uplink's payloads are not in it and nothing generates them, so the C# class and the TypeScript interface are two hand-written declarations of one shape, and nothing checks that they agree.

Keep them in one file each, next to each other in the repository, and change them together.

## The SDK and the contract assembly have drifted apart

They are published on different schedules and are not in step. `CommandErrorCode` is the measurable case: the contract sends a refusal as a string id such as `"insufficientFunds"`, while the published SDK still declares an integer enum of seven members, so no value a plugin sends matches one of its members.

Treat the SDK's generated types as a floor rather than a description of the mod you are talking to, and handle a value you do not recognise.

## The published client message union is incomplete

In `@ksp-gonogo/sitrep-sdk@0.0.1`, `ClientMessage` covers `subscribe`, `unsubscribe` and `command-request`, and `ServerMessage` has no `command-accepted` or `stream-binary`. The server sends and accepts all of them, and the SDK these pages document declares them, but against 0.0.1 sending `set-vantage` means stepping outside the SDK's type, and `command-request` has no `label` or `topic`.

## Command results are untyped end to end

`command-response.result` is `unknown`. The command name does not imply a result type in either direction, so every caller casts. Declare one result interface per command and cast in one place.

## The Gonogo mod is not released

Not on CKAN, not on SpaceDock, no download. The only way to get it, and therefore the only way to get `Sitrep.Contract.dll`, is to build it from source.

That has two knock-on effects. There is no CKAN identifier your Uplink can declare a dependency on, so nothing stops a player installing your Uplink without the assembly it needs. And the copy you compile against is whatever your build produced, with no way to pin a contract version in your project file or state which one your Uplink needs. Record what you built against in your README.

## Binary frames are not in the SDK

`@ksp-gonogo/sitrep-sdk@0.0.1` has no decoder for [binary frames](/reference/client/binary-lane), and `ServerMessage` has no `stream-binary` member. Decode them yourself; the format is short.

## A scaffolded Uplink does not build on its own yet

`uplink-tools new` writes an Uplink whose client imports generated types that only the Gonogo Uplinks repository's codegen produces, and whose C# projects resolve `Sitrep.Contract` through `$(GonogoContract)` and `$(GonogoDevkit)`, MSBuild properties only that repository defines. Outside it, set both properties to a directory holding the contract assembly, and write the generated client types by hand from your contract slice, until the toolchain ships both.

## Command handlers do not run on the main thread

And `Sitrep.Contract` provides no way to get onto it. A handler that must call the game records the request for the next main-thread capture to apply, as the [command page](/guide/commands) shows. There is no supported way to make a handler's return value depend on a game call.
