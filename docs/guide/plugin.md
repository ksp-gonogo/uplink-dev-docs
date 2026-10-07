# The plugin class

The plugin is one class in `mod/`. This page covers what Gonogo needs from it: how it is found, what its manifest declares, where its work is wired up, and how it reports its own health.

## How Gonogo finds it

<<< ../../example/mod/ExampleUplink.cs#declaration{cs}

When the game loads, Gonogo scans every assembly that references `Sitrep.Contract` for a class carrying `SitrepUplinkAttribute`, and constructs it, so the class needs a public constructor with no parameters. The attribute's argument is the Uplink's id, the same id as in `uplink.json`.

The class implements `ISitrepUplink`, which is three members: `Manifest`, `Register` and `Health`.

## The manifest

<<< ../../example/mod/ExampleUplink.cs#manifest{cs}

`UplinkManifest` declares everything the Uplink publishes and accepts before any of it runs, and Gonogo refuses a handler for a command the manifest does not declare.

- **`Id`** must equal the attribute's id
- **`Version`, `Name`, `Author` and `Repo`** come from `Provenance`, a class `bake` writes from `uplink.json` and `client/package.json`, so the plugin and the client always carry one version
- **`ExpectedClientHash` and `ClientSource`** say where the client bundle is and which bundle this plugin vouches for. The app loads a client only for a plugin that vouches for its hash; [Releasing and installing](/guide/release) covers how the two meet
- **`Channels`** lists the Topics the plugin publishes ([Publishing a Topic](/guide/topics))
- **`Commands`** lists the commands it accepts ([Accepting a command](/guide/commands))

## Register

<<< ../../example/mod/ExampleUplink.cs#register{cs}

`Register` is called once, on the main thread, after the manifest is read. Wire up every source and handler here and return. An exception thrown out of `Register` marks this Uplink unavailable and leaves the rest of Gonogo running.

There is no matching teardown: the Uplink lives as long as the game does, so anything `Register` installs stays installed.

## Health

<<< ../../example/mod/ExampleUplink.cs#health{cs}

`Health` returns an `UplinkHealth`: `Healthy`, `Degraded` (working, with something it needs missing or wrong) or `Unavailable`, with a sentence the operator reads beside it. Gonogo calls it often and off the main thread, so it must be cheap, must not block, and must not touch the game. An Uplink wrapping another mod reports that mod's absence here.

When the mod you integrate is missing at load, also call `IUplinkHost.SetAvailability` from `Register` with `Availability.Unavailable` and a reason, and return without registering anything.

## The sample

<<< ../../example/mod/ExampleUplink.cs#sample{cs}

`AddChannelSource` takes a function from the tick's `KspSnapshot` to the Topic's payload. It runs on the Courier thread, the background thread that writes the stream, so it may read the snapshot and its own fields and nothing in the game. Returning `null` publishes nothing for that tick, which a widget shows as still waiting. Never substitute a zero: downstream a made-up zero cannot be told from a real reading.

## Calling the game

A plugin that reads live game state, rather than the snapshot every source shares, needs two things:

- **A reference to KSP's assemblies**, added to `mod/GonogoExampleUplink.csproj` with `Private="false"` so they are never copied into your release:

  ```xml
  <Reference Include="Assembly-CSharp" Private="false">
    <HintPath>$(KspManaged)/Assembly-CSharp.dll</HintPath>
  </Reference>
  ```

  `KspManaged` comes from where your KSP install is: set the `KSP_ROOT` environment variable to the folder holding `KSP_Data` (or `KSP.app`) and `GameData`, pass `-p:KspRoot=<that folder>`, or write it in a `ksp.local.props` beside `Directory.Build.props`, which tells you the exact form. A build that needs it and cannot find it says so

- **`IUplinkHost.AddSampledSource`** instead of `AddChannelSource`. It takes two functions: the first runs on the main thread, where reading the game is safe, and returns plain data; the second runs on the Courier thread with exactly what the first returned, and publishes it. Never pass a live game object, such as a `Vessel` or a `Part`, from the first to the second: reading one off the main thread can crash the game

## Reaching another mod

Reach the mod you integrate by reflection, not by referencing its assembly. A plugin that references a missing assembly fails to load at all, where one that uses reflection can report the mod missing in `Health`. A reference also brings that mod's licence terms to your combined work.

Two cautions about what you read:

- **Read fields rather than call methods** unless you have read the method's body. A method that looks like a getter can do anything, including stopping the game, and nothing in its signature says so. A decompiler such as ILSpy shows you what it does
- **A field is only as true as whatever writes it.** Some mods recompute a field only while one of their windows is open, so a field nobody has written yet still holds its starting value and looks like real data. For those, read the value at the moment the mod writes it, by patching that method with a library such as Harmony, and publish it with the game time it was true at

Next: [Publishing a Topic](/guide/topics).
