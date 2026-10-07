# Wrapping a mod

Most Uplinks exist to bring another mod's state into Gonogo, such as SCANsat's coverage or TestFlight's engine reliability. This page covers how a plugin reaches that mod, reads it safely, and says when it is missing, following the Uplinks in [gonogo-uplinks](https://github.com/ksp-gonogo/gonogo-uplinks/tree/addc1fa21877b9de1e60909f4ec572d3b51a86ef/uplinks), which wrap twelve mods between them.

## Two ways to reach the mod

| | By reflection | By a compile-time reference |
| --- | --- | --- |
| How | Find the mod's assembly among the loaded ones and its types and members by name | Reference the mod's DLL in the plugin's project, and call it like any library |
| When the mod is missing | The plugin loads, reports the mod missing, and publishes that | The plugin cannot work, so the netkan makes the mod a dependency |
| When the mod changes | A renamed member is found missing at load, and reported | A renamed member fails when it is called |
| Licence | Yours | The mod's licence reaches your plugin, a combined work |
| Used by | TestFlight, Kerbalism, Ferram Aerospace Research, RealFuels, RP-1, Principia | SCANsat, kOS, MechJeb, kerbcast |

Reflection is the default: it keeps your plugin loadable without the mod, and keeps the mod's licence off your work. A compile-time reference suits a mod whose API you call heavily and whose presence your Uplink cannot do without; gonogo-uplinks' SCANsat and MechJeb Uplinks are licensed GPL-3.0 because they link those mods.

## By reflection

A class holding everything the plugin reads from the mod, found once, when the game loads. This example reaches KSP's own `Planetarium` as a stand-in, so it compiles and runs with no mod installed; a real Uplink names its mod's assembly, types and members in the same places:

<<< ../../reference/examples/mod/WrappingExample.cs#binder{cs}

- **Find the assembly by name** among `AppDomain.CurrentDomain.GetAssemblies()`, once, when the plugin is constructed, as TestFlight's and Kerbalism's Uplinks do
- **Resolve each type and member once**, with the binding flags and parameter types the mod actually declares. A member that does not resolve is a mod version you were not built against: record which, so the operator can be told
- **Read only on the main thread.** The binder's reads run in the main-thread half of `AddSampledSource`, never on the Courier thread

[TestFlightReflection.cs](https://github.com/ksp-gonogo/gonogo-uplinks/blob/addc1fa21877b9de1e60909f4ec572d3b51a86ef/uplinks/testflight/mod/TestFlightReflection.cs) is a full binder for a real mod: about twenty members, each bound by its exact signature, with a list of what bound and what did not.

## By a compile-time reference

Add the mod's DLL to `mod/<GameData name>.csproj` with `Private="false"`, so it is compiled against and never copied into your release:

```xml
<Reference Include="SCANsat" Private="false">
  <HintPath>$(KspGameData)\SCANsat\Plugins\SCANsat.dll</HintPath>
</Reference>
```

`KspGameData` is your KSP install's `GameData` folder, set the same way as `KspManaged` ([The plugin class](/guide/plugin#calling-the-game)): `new --ksp`, `KSP_ROOT`, or `ksp.local.props`. Then:

- **Make the mod a dependency** in `mod/<GameData name>.netkan`'s `depends`, so CKAN never installs your Uplink without it
- **Check the version you were given** before you use it. SCANsat's and MechJeb's Uplinks probe the mod's assembly in `Register` for every type and member they call and for a known-good version range, and go unavailable with the reason when the probe fails: [SCANsat's VersionGuard.cs](https://github.com/ksp-gonogo/gonogo-uplinks/blob/addc1fa21877b9de1e60909f4ec572d3b51a86ef/uplinks/scansat/mod/VersionGuard.cs)

A build server has no KSP install, so a plugin that references the game or a mod cannot build on a public CI runner; `new --workflows` says so in the workflow it writes.

## Saying the mod is missing

<<< ../../reference/examples/mod/WrappingExample.cs#manifest{cs}

<<< ../../reference/examples/mod/WrappingExample.cs#register{cs}

<<< ../../reference/examples/mod/WrappingExample.cs#health{cs}

- **Publish `<id>.available`** (here `clock.available`), a boolean the plugin answers whether or not the mod is there, declared `TrueNow` because it is a fact about this install. Most of the gonogo-uplinks Uplinks that publish Topics do. A client tells "the mod is not installed" (`false`) from "nothing has arrived yet" (pending)
- **Return early from `Register`** when the mod is missing, after `IUplinkHost.SetAvailability` with the reason, so no source runs against a mod that is not there
- **Report it from `Health`**, with the same reason as the `UplinkHealth`'s `Detail`, its second argument: the app draws it in place of the Uplink's widgets
- **Declare commands only when the mod is there.** TestFlight's manifest lists its repair command only when TestFlight loaded, so on an install without it the command does not exist rather than failing when sent

### Declaring `<id>.available`

Its payload is a bare boolean, so it needs no wire type in the contract slice: the plugin declares only its channel, as the manifest above declares `clock.available`, and publishes `true` or `false`. The client types it and registers it by hand, in `client/src/topics.ts` beside the generated Topics:

<<< ../../reference/examples/guide/clockTopics.ts

`registerBarePrimitiveTopic` makes the id known at runtime, the way the generated Topics are; [`registerBarePrimitiveTopic`](/reference/client/reading-telemetry#registerBarePrimitiveTopic) has the detail.

`<id>.available` also makes the Uplink's id a [Domain](/reference/concepts/domain-and-seat): a client's augment that names it in `requires` mounts once the Topic has published anything, `true` or `false`, which says the Uplink is installed. Read its value for whether the mod is.

## Reading on the main thread

Every read of a mod's state goes in the first function of `IUplinkHost.AddSampledSource`, which runs on the main thread and returns plain data; the second runs on the Courier thread and publishes it. Pass Topic names after the two functions, as above, and neither runs while no client is watching those Topics, so an unwatched mod costs nothing. [The plugin class](/guide/plugin#calling-the-game) covers the two halves.

## What the save has not unlocked

Some of a mod's state is not the operator's to see until the career has earned it, such as a scanner's data before the part is researched. A `ChannelDeclaration` or `CommandDeclaration` takes `Requires`: what the save must have unlocked before the channel carries anything or the command runs, checked by Gonogo, so neither the plugin nor a widget checks it. When the rule is the mod's own, register an evaluator for it with `IUplinkHost.AddGateEvaluator`: MechJeb's Uplink locks its autopilot commands by MechJeb's own unlock check, in [MechJebUnlockGate.cs](https://github.com/ksp-gonogo/gonogo-uplinks/blob/addc1fa21877b9de1e60909f4ec572d3b51a86ef/uplinks/mechjeb/mod/MechJebUnlockGate.cs).

## Testing without the mod

Keep every line that names a KSP or mod type in its own file, and leave that file out of `mod-tests` ([Testing](/guide/testing#the-plugin-s-tests)). MechJeb's Uplink is a `partial` class split this way: `MechJebUplink.cs` holds the manifest and the logic, which the tests compile, and `MechJebUplink.Ksp.cs` the MechJeb and Unity calls, which they do not. A reflection binder can be tested as it is: built in a test, with the mod absent, it reports the mod missing.

## In uplink.json

`mod` names the mod the Uplink wraps, its version and how a player gets it:

```json
"mod": { "name": "TestFlight", "tier": "ckan", "builtAgainst": "2.12.0.0" }
```

It gates nothing: the generated page prints it, and the app does not read it. The netkan's `depends` is what keeps a player from installing a direct-linked Uplink without its mod ([uplink.json](/guide/uplink-json)).

## What this page cannot show

- **A wrapped mod running.** Every example here compiles against the contract alone; none runs against a mod, because this documentation is built with no KSP. The linked gonogo-uplinks sources are the worked examples that do
- **Patching a mod with Harmony** to read a value at the moment it is written. Kerbalism's and kOS's Uplinks do it, against KSP and the mod; a snippet would need both to compile

Next: [A widget](/guide/client-widget).
