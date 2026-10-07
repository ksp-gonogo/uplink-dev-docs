# Known limits

What the published packages do not do, so you find out here rather than three days in.

## ui-kit does not load under Node

`@ksp-gonogo/ui-kit` ships ESM whose component barrels a bundler resolves and bare Node does not. Vite, webpack, esbuild and Rollup are unaffected. A Node-based test runner needs the package inlined into its transform pipeline: in Vitest, `server.deps.inline: [/@ksp-gonogo/]`. `@ksp-gonogo/sitrep-sdk` loads under Node as it is.

## React 19 will not install

`@ksp-gonogo/ui-kit` declares `react@^18` as its peer dependency, so `npm install` fails with `ERESOLVE` against React 19. Pin React 18.

## You cannot publish a type of your own

The mod's serialiser writes dictionaries, arrays, strings, numbers, booleans, and the payload types the mod itself declares. There is no reflection over an arbitrary object, and no extension point for one.

So your payloads are `Dictionary<string, object?>`, built by hand. The compiler cannot help, because `IChannelPublisher.Publish` takes `object?`.

**The failure comes at runtime.** The first frame the serialiser cannot write marks your Uplink unavailable, and each subscriber gets an `error` frame with code `payload-serialization-error` naming the type it could not write.

## No generated types for your own Topics

The SDK's typed Topic map is generated from the Gonogo mod's own contract. Your Uplink's payloads are not in it, and outside the Gonogo Uplinks repository nothing generates them, so the C# class and the TypeScript interface are two hand-written declarations of one shape, and nothing checks that they agree.

Keep them in one file each, next to each other in the repository, and change them together.

## The Gonogo mod is not on CKAN or SpaceDock yet

Players get it as a release candidate download for now. `Sitrep.Contract`, the assembly your plugin compiles against, is published on NuGet as `KspGonogo.Sitrep.Contract`, so you can reference it at a pinned version rather than building the mod.

There is no CKAN identifier your Uplink can declare a dependency on yet, so nothing stops a player installing your Uplink without the mod. Record in your README which Gonogo version you built against.

## A scaffolded Uplink does not build on its own yet

`uplink-tools new` writes an Uplink whose client imports generated types that only the Gonogo Uplinks repository's codegen produces, and whose C# projects resolve `Sitrep.Contract` through `$(GonogoContract)` and `$(GonogoDevkit)`, MSBuild properties only that repository defines. Outside it, set both properties to a directory holding the contract assembly, and write the generated client types by hand from your contract slice, until the toolchain ships both.

## Command handlers and the main thread

The shipped Gonogo mod runs a command handler on the Unity main thread, so a handler may call the game. `Sitrep.Contract` does not promise it: a host that ran handlers elsewhere would still satisfy the contract. A handler that must stay safe against such a host records the request for the next main-thread capture to apply, as the [command page](/guide/commands) describes.
