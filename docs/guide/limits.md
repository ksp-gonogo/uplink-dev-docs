# Known limits

At the <Published field="name" /> <Published field="version" />, the published packages do not do the following, and each item says what to do instead.

## The plugin

- **A payload is a dictionary.** The Gonogo mod writes dictionaries, lists, strings, numbers and booleans, and its own contract's types, but not a class of yours, so `IChannelPublisher.Publish` takes `object?` and nothing checks a payload at compile time. Hold the dictionary's keys to the contract slice's type in the plugin's tests ([Publishing a Topic](/guide/topics#publishing))
- **Command handlers run on the main thread because the shipped mod runs them there.** `Sitrep.Contract` does not promise it. A handler that must be safe on any thread records the request in a field and applies it from the main-thread half of an `IUplinkHost.AddSampledSource` ([The plugin class](/guide/plugin#calling-the-game)), reading and writing the field with `Interlocked`
- **A successful load is silent.** Look for the Uplink's data, not for a line in `KSP.log` ([Releasing and installing](/guide/release#checking-it-loaded))

## The client

- **React 18 only.** `@ksp-gonogo/ui-kit` declares `react@^18` as its peer, and npm refuses React 19 beside it
- **ui-kit needs inlining in a Node test runner.** Its component modules resolve in a bundler and not in bare Node, so the test runner must bundle them (vitest's `server.deps.inline`). The scaffold's `client/vitest.config.ts` already does this for every Gonogo package, so you do nothing unless you write your own config
- **A reckoner for an Uplink's Topic models the whole payload.** A model of some fields only is offered for a core Topic whose contract declares those fields, and never for an Uplink's ([Writing a reckoner](/guide/reckoners#the-model))
- **A text field has no `Unit` of its own.** A `Units.Text` field is a `Reading` of a string, which `Unit` does not take: draw it with `HeldFigure` and `derivedMarking` ([A widget](/guide/client-widget#a-text-field))

## The tools

- **The version is in three places**: `client/package.json`, `UPLINK_VERSION` in `client/src/uplink.ts`, and the folder in `client.url`. `release` refuses while they disagree, but changing them is yours ([Releasing and installing](/guide/release#a-new-version))
- **`new` is supported on macOS and Linux**, not on Windows. Its commands need only Node and the .NET SDK, but nothing checks them there; under WSL they run in Linux, the tested setup. The shell lines in this Guide are POSIX: in PowerShell, `mkdir -p <dir>` is `New-Item -ItemType Directory -Force <dir>` and `cp` is `Copy-Item`
