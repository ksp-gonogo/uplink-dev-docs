# Known limits

What the published packages, at the <Published field="name" /> <Published field="version" />, do not do, and what to do instead.

## The plugin

- **A payload is a dictionary.** The Gonogo mod writes dictionaries, lists, strings, numbers and booleans, and its own contract's types, but not a class of yours, so `IChannelPublisher.Publish` takes `object?` and nothing checks a payload at compile time. Hold the dictionary's keys to the contract slice's type in the plugin's tests ([Publishing a Topic](/guide/topics#publishing))
- **Command handlers run on the main thread because the shipped mod runs them there.** `Sitrep.Contract` does not promise it. A handler that must be safe on any thread records the request in a field and applies it from the main-thread half of an `IUplinkHost.AddSampledSource` ([The plugin class](/guide/plugin#calling-the-game)), reading and writing the field with `Interlocked`
- **A successful load is silent.** Look for the Uplink's data, not for a line in `KSP.log` ([Releasing and installing](/guide/release#checking-it-loaded))

## The client

- **React 18 only.** `@ksp-gonogo/ui-kit` declares `react@^18` as its peer, and npm refuses React 19 beside it
- **ui-kit needs inlining in a Node test runner.** Its component modules resolve in a bundler and not in bare Node. The scaffold's `client/vitest.config.ts` already inlines every Gonogo package
- **A command's client types are written by hand.** `codegen` generates the arguments type but not the command map, so each command needs its line in `CommandArgsMap` and `CommandReplyMap`, and a `registerUplinkCommand` call whose rail agrees with the plugin's declaration ([Sending a command](/guide/client-commands)). The reference's description of the rail as a row of a generated map describes what `codegen` does not yet write
- **A reckoner for an Uplink's Topic models the whole payload.** A model of some fields only is offered for a core Topic whose contract declares those fields, and never for an Uplink's ([Writing a reckoner](/guide/reckoners#the-model))

## The tools

- **The version is in three places**: `client/package.json`, `UPLINK_VERSION` in `client/src/uplink.ts`, and the folder in `client.url`. Change them together ([Releasing and installing](/guide/release#a-new-version))
- **`client/uplink.md` is read by nothing**, though `new` suggests describing the Uplink there. The page's opening paragraph is the `description` in `src/uplink.ts` ([Documenting your Uplink](/guide/documenting#uplink-md))
- **The generated page lists Topics and widgets, not commands**
- **A changed client means a rebuilt plugin**, even with a development URL, because the app checks every bundle against the hash the plugin vouches for ([Releasing and installing](/guide/release#trying-a-client-before-you-publish-it))
- **The netkan `new` writes needs one edit before CKAN can use it** ([Releasing and installing](/guide/release#ckan-and-spacedock))
- **`new` is tested on macOS and Linux**, not on Windows
