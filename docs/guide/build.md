# Build and install

## Build

```bash
dotnet build mod/ExampleUplink/ExampleUplink.csproj -c Release \
  -p:SitrepContractDll="/path/to/GameData/Gonogo/Plugins/Sitrep.Contract.dll"
```

The output is one file, `ExampleUplink.dll`. If `Sitrep.Contract.dll` also appears in your output directory, `Private="false"` is missing from the reference. Fix it before installing: the duplicate shadows the assembly Gonogo loaded, and the two copies are not the same types.

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

The mod serves a plain WebSocket on port 8090, with no path, no sub-protocol, and no handshake. Any client can check the plugin without the browser half:

```
ws://localhost:8090
```

Send a subscribe frame:

```json
{ "type": "subscribe", "topic": "example.status" }
```

A successful subscribe is acknowledged with an event frame:

```json
{ "type": "event", "topic": "example.status", "name": "subscribed", "meta": {} }
```

**A Topic the mod does not know is answered with silence.** No error, no acknowledgement. If nothing comes back, either the name is wrong or your Uplink did not load, and the protocol will not tell you which.

Next: [Connecting](/guide/client-stream).
