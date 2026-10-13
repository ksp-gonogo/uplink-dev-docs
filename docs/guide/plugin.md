# The plugin class

The plugin is one class in `mod/`, `ExampleUplink.cs`. This page covers what Gonogo needs from it: how it is found, what its manifest declares, where its work is wired up, and how it reports its own health.

The snippets on this page come from the finished example, so they already carry the `example.reset` command (`ResetCommand`, its declaration and its handler) that [Accepting a command](/guide/commands) adds. The file `new` writes is the same without those lines. The Health, unavailable and sampled-source snippets come from a separate file of sketches, compiled against the contract: they are not in the example, and their fields (`_modLoaded`, `_staleSamples`) stand for state your own plugin finds when the game loads, which [Wrapping a mod](/guide/wrapping-a-mod) shows being found.

Two threads matter throughout. The **main thread** is the game's own, the only one that may touch KSP. The **Courier thread** is the Gonogo mod's background thread, which samples every Topic and writes the stream; code running on it must never touch the game.

## How Gonogo finds it

<<< ../../example/mod/ExampleUplink.cs#declaration{cs}

When the game loads, The Gonogo mod scans every assembly that references `Sitrep.Contract`, as the scaffold's project does, for a class carrying `SitrepUplinkAttribute`, and constructs it, so the class needs a public constructor with no parameters. The attribute's argument is the Uplink's id, the same id as in `uplink.json`.

The class implements `ISitrepUplink`, which is three members: `Manifest`, `Register` and `Health`.

## The manifest

<<< ../../example/mod/ExampleUplink.cs#manifest{cs}

`UplinkManifest` declares everything the Uplink publishes and accepts before any of it runs, and Gonogo refuses a handler for a command the manifest does not declare.

- **`Id`** must equal the attribute's id
- **`Version`, `Name`, `Author` and `Repo`** come from `Provenance`, a class `bake` writes into `mod/Provenance.g.cs` from `uplink.json` and `client/package.json`, so the plugin and the client always carry one version
- **`ExpectedClientHash` and `ClientSource`**, also written by `bake`, say where the client bundle is and which bundle this plugin vouches for. The app loads a client only for a plugin that vouches for its hash ([Releasing and installing](/guide/release#how-the-app-loads-a-client))
- **`Channels`** lists the Topics the plugin publishes ([Publishing a Topic](/guide/topics)): `Delivery`, `Emission` and `keyframeIntervalUt` in the heartbeat's declaration are covered there. `keyframeIntervalUt` is in UT, universal time, the game's clock in seconds ([Concepts](/guide/concepts#topics-and-samples)). `Kind` says how the value relates to time: `SampleKind.Continuous` says it moves between samples, which lets the client carry it forward with a forward model of its own, called a reckoner ([Writing a reckoner](/guide/reckoners)), and `Discrete` says it stands until the next sample replaces it. The finished example says `Continuous`; `new` writes `Discrete`
- **`Commands`** lists the commands it accepts ([Accepting a command](/guide/commands))

## Register

<<< ../../example/mod/ExampleUplink.cs#register{cs}

`Register` is called once, on the main thread, after the manifest is read. Wire up every source and handler here and return. An exception thrown out of `Register` marks this Uplink unavailable and leaves the rest of Gonogo running.

There are three ways to tell the app an Uplink cannot work, and each has its own job:

- **`host.SetAvailability(Availability.Unavailable(reason))` and an early return** is for a condition you expect and can test for in `Register`, such as the wrapped mod not being installed. Nothing is registered, and the operator reads your reason in place of the Uplink's widgets. It only works while `Register` is running: called anywhere else, it is ignored and the mod logs that
- **An exception thrown out of `Register`** is for a fault you did not expect. The Uplink is marked unavailable in the same way, the exception's message is the reason, and the mod writes a `[ChannelEngine]` line to `KSP.log` ([Releasing and installing](/guide/release#checking-it-loaded))
- **`Health()` returning `UplinkHealth.Unavailable(detail)` or `UplinkHealth.Degraded(detail)`** is for a state that changes after load, such as the mod stopping its updates. The mod polls it, so it can recover. `Degraded` says the Uplink works but something it needs is missing or wrong; `Unavailable` says none of its Topics will carry anything

There is no matching teardown: the Uplink lives as long as the game does, so anything `Register` installs stays installed.

## Health

<<< ../../example/mod/ExampleUplink.cs#health{cs}

`Health` returns an `UplinkHealth`: an `UplinkHealthState`, with a sentence the operator (the person using the app) reads beside it.

<!--@include: @/.vitepress/includes/uplink-health-states.md-->

`UplinkHealth` is a read-only struct, so an object initialiser (`new UplinkHealth { State = ... }`) does not compile. Build one with the static member of `UplinkHealth` for its state, called as in the snippet below: the field `Healthy`, which has nothing to add, and the functions `Degraded(detail)` and `Unavailable(detail)`, which take the sentence the operator reads. The two functions also take an optional list of labelled facts, rows such as the version of the mod you depend on. The constructor, `new UplinkHealth(state, detail)`, builds the same value.

The Gonogo mod polls it repeatedly: once per sample of the `system.uplinks` Topic, which the Gonogo mod publishes itself and which lists every installed Uplink with whether it is available and its health (the app reads it to decide which clients to load and what to draw in place of a widget whose Uplink is unwell), and off the main thread. So it must be cheap, must not block, and must not touch the game. The heartbeat has nothing to report; an Uplink wrapping another mod reports that mod's state:

<<< ../../reference/examples/mod/GuideExamples.cs#health{cs}

When the mod you integrate is missing at load, `Register` also calls [`IUplinkHost.SetAvailability`](/reference/mod/host-and-kernel#IUplinkHost.SetAvailability) with an [`Availability`](/reference/mod/#Availability) saying why, and registers nothing:

<<< ../../reference/examples/mod/GuideExamples.cs#unavailable{cs}

## The sample

<<< ../../example/mod/ExampleUplink.cs#sample{cs}

`AddChannelSource` takes a function from the tick's `KspSnapshot` to the Topic's payload. A **tick** is one round of the Courier's sampling; the snapshot holds what the Gonogo mod read from the game for it, such as the game time. The function runs on the Courier thread, so it may read the snapshot and its own fields and nothing in the game. Returning `null` publishes nothing for that tick, which a widget shows as still waiting. Never substitute a zero: downstream a made-up zero cannot be told from a real reading.

## Calling the game

A plugin that reads live game state, rather than the snapshot every source shares, needs two things.

**A reference to KSP's assemblies**, added to `mod/GonogoExampleUplink.csproj` with `Private="false"` so they are never copied into your release:

```xml
<Reference Include="Assembly-CSharp" Private="false">
  <HintPath>$(KspManaged)/Assembly-CSharp.dll</HintPath>
</Reference>
```

`KspManaged` is KSP's `Managed` assemblies folder, which the build finds from your KSP folder (`KspRoot`), the one holding `KSP_Data` (or `KSP.app`) and `GameData`. Give that folder as `new --ksp <folder>`, as the `KSP_ROOT` environment variable, as `-p:KspRoot=<folder>` on a build, or in a `ksp.local.props` beside `Directory.Build.props`:

```xml
<Project><PropertyGroup><KspRoot>/path/to/KSP</KspRoot></PropertyGroup></Project>
```

A build that needs it and cannot find it says which of these to set.

**A source registered with `IUplinkHost.AddSampledSource`** rather than `AddChannelSource`. It takes two functions: the first runs on the main thread, where reading the game is safe, and returns plain data; the second runs on the Courier thread with exactly what the first returned, and publishes it.

<<< ../../reference/examples/mod/GuideExamples.cs#sampled{cs}

The comment in that snippet assumes a `ChannelDeclaration` for `example.status` in the manifest's `Channels`, as the manifest above declares `example.heartbeat`: `host.Publisher` for a Topic the manifest does not declare is refused. The second argument to `Publish` is the game time the payload was true at.

A second overload takes, after the two functions, the Topic prefixes the source publishes (an exact Topic is its own prefix), and skips the main-thread read on every tick no client is watching them; [Wrapping a mod](/guide/wrapping-a-mod#reading-on-the-main-thread) uses it. Never pass a live game object, such as a `Vessel` or a `Part`, from the first function to the second: reading one off the main thread can crash the game.

### Without the game's assemblies

Nothing in this Guide lists KSP's types or members, and nobody can check a name for you without the game's code. The one place the names are written down is `Assembly-CSharp.dll`, in the `Managed` folder of any KSP install; open it with a decompiler such as [ILSpy](https://github.com/icsharpcode/ILSpy) and read the types there. So an Uplink that reads the game needs a copy of KSP at hand to learn what to call, even if the build does not. An author without KSP can still write the plugin: reach KSP's own types by reflection, the way the next section does for other mods (look the type up by name, as `Type.GetType("FlightGlobals, Assembly-CSharp")` does, read its members, and report a missing one in `Health` instead of failing to load), then fill in the names once a copy is available. A wrong name is found only when the plugin runs inside the game. The build, the tests and `release` do not need the game at all; reading its state and trying the plugin in KSP do.

## Reaching another mod

Prefer reaching the mod you integrate by reflection over referencing its assembly. A plugin that references a missing assembly fails to load at all, where one that uses reflection can report the mod missing in `Health`. A reference also brings that mod's licence terms to your combined work. [Wrapping a mod](/guide/wrapping-a-mod) covers both, and when a reference suits.

Two cautions about what you read:

- **Read fields rather than call methods** unless you have read the method's body. A method that looks like a getter can do anything, including stopping the game, and nothing in its signature says so. A decompiler such as [ILSpy](https://github.com/icsharpcode/ILSpy) shows you what it does
- **A field is only as true as whatever writes it.** Some mods recompute a field only while one of their windows is open, so a field nobody has written yet still holds its starting value and looks like real data. For those, read the value at the moment the mod writes it, by patching that method with [Harmony](https://harmony.pardeike.net/), and publish it with the game time it was true at

## The whole file

::: details ExampleUplink.cs
<<< ../../example/mod/ExampleUplink.cs{cs}
:::

Next: [Publishing a Topic](/guide/topics).
