# Build and install

## Build

```bash
dotnet build mod/ExampleUplink/ExampleUplink.csproj -c Release \
  -p:SitrepContractDll="/path/to/GameData/Gonogo/Plugins/Sitrep.Contract.dll"
```

The output lands in `bin/Release/`, without a target-framework subdirectory, because the project sets `AppendTargetFrameworkToOutputPath=false`. You want `ExampleUplink.dll` from there; the `.pdb` beside it is debug symbols and does not need to ship.

**Nothing else should be in that directory.** If `Sitrep.Contract.dll` appears, `Private="false"` is missing from the reference. Fix it before installing: the duplicate shadows the assembly Gonogo loaded, and the two copies are not the same types.

## Install

Your own top-level directory under `GameData`, never inside `GameData/Gonogo/`:

```
KSP/GameData/ExampleUplink/
├── Plugins/
│   └── ExampleUplink.dll
├── LICENSE
└── README.md
```

Discovery scans every loaded assembly that references `Sitrep.Contract`, so the exact path under `GameData` does not matter. `Plugins/` is the convention.

## Check it loaded

Loading is quiet. A successfully registered Uplink writes nothing to `KSP.log`, so silence is the expected result and not evidence of anything.

Two failures do appear, both prefixed `[Gonogo] [ChannelEngine]`:

```
uplink "example" marked UNAVAILABLE: registration threw: <message>
uplink "example" marked UNAVAILABLE: capability declaration threw: <message>
```

Three failures appear nowhere you can see. Discovery writes them to standard error, which KSP does not capture:

- The class carries `[SitrepUplink]` but has no public parameterless constructor
- The assembly could not be scanned
- The type could not be instantiated

Calling `SetAvailability(Availability.Unavailable(...))` yourself is also not logged. It is reported on a `system.uplinks` Topic, which the SDK's typed Topic map does not include, so reading it means subscribing by string and typing the payload yourself.

**So confirm your Uplink loaded by looking for its data, not for a log line.**

## Verify the Topic

The mod serves a plain WebSocket on port 8090, with no path, no sub-protocol, and no handshake. It binds every interface, so a browser on another machine on the same network reaches it at the game machine's address. The port is fixed and there is no setting for it.

Any client can check the plugin without the browser half:

```
ws://<the machine running KSP>:8090
```

Send a subscribe frame:

```json
{ "type": "subscribe", "topic": "example.status" }
```

A successful subscribe is acknowledged with an event frame:

```json
{ "type": "event", "topic": "example.status", "name": "subscribed", "meta": { ... } }
```

**A Topic the mod does not know is answered with silence.** No error, and no acknowledgement either, which is the one thing you can act on: an acknowledgement means the Topic exists and your Uplink loaded, and its absence means one of the two is wrong.

Next: [Connecting](/guide/client-stream).
