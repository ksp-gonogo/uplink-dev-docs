# IUplinkHost

`Sitrep.Contract`

Handed to `Register`. Every capability an Uplink has, it has through this object.

## Clock

```csharp
double NowUt();
```

Current Universal Time in seconds. Use it as the timestamp when you publish from an event rather than from a sample.

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#clock{cs}

## Publishing

```csharp
void AddSampler(ISnapshotSampler sampler);
void AddChannelSource(string topic, Func<KspSnapshot?, object?> map);
IChannelPublisher Publisher(string topic);

void AddSampledSource(
    Func<KspSnapshot?, object?> captureOnMainThread,
    Action<object?> handleOnCourier);

void AddSampledSource(
    Func<KspSnapshot?, object?> captureOnMainThread,
    Action<object?> handleOnCourier,
    params string[] subscriptionTopicPrefixes);

bool IsAnyTopicSubscribed(string topicPrefix);
void ForceKeyframe(string topic);
void ResetChannelBirth(IEnumerable<string> topics);
```

| Method | Thread | Use for |
| --- | --- | --- |
| `AddChannelSource` | Courier | A value derivable without the game |
| `Publisher(...).Publish` | Main | Publishing from your own event |
| `AddSampledSource` | Both | Anything that reads the game on a cadence |

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#publishing{cs}

`captureOnMainThread` must return plain data. `handleOnCourier` receives that object off the main thread; a live `Vessel` or `Part` reaching it crashes KSP.

The `subscriptionTopicPrefixes` overload skips the capture entirely when nothing under those prefixes is subscribed. The skip is total and silent, so do not use it for a capture that also updates state something else reads. Check `IsAnyTopicSubscribed` at the publish instead.

`ForceKeyframe` makes the next sample on a Topic an unconditional keyframe, past any deadband or cadence gate. `ResetChannelBirth` puts the named Topics back to never-having-published, so a Topic the new subject has no data for reports absence rather than inheriting the previous subject's state. Call them together when the thing a Topic describes changes identity mid-stream.

**Both may only be called from inside a registered `ISnapshotSampler.Sample` or a command handler.** Those are the two places the engine runs on its own thread; calling from arbitrary main-thread code races the emitter with no synchronisation.

### ISnapshotSampler

```csharp
public interface ISnapshotSampler
{
    void Sample(KspSnapshot snapshot);
}
```

Runs on the main thread once per snapshot, before any mapper. Use it to gather state that several of your Topics share.

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#sampler{cs}

### KspSnapshot

```csharp
public sealed class KspSnapshot
{
    public double Ut { get; set; }
    public Dictionary<string, object?> Values { get; set; }
}
```

One instance is shared by every sampler and mapper for that tick. Treat it as immutable once `Sample` returns.

### IChannelPublisher

```csharp
public interface IChannelPublisher
{
    void Publish(object? payload, double ut);
}
```

`ut` is the time the value was true at, not the time you are publishing it. Passing the wrong one puts the reading at the wrong point on the operator's timeline.

## Dynamic Topics

```csharp
IDynamicChannelSource RegisterDynamicNamespace(string prefix, ChannelDeclaration template);

public interface IDynamicChannelSource
{
    IChannelPublisher Publisher(string subTopic);
    void OnSubscribed(Action<string> callback);
}
```

For a Topic per runtime-discovered thing, where the names are not known at declaration time. Sub-topics under `prefix` inherit `template` and need no declaration of their own.

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#dynamic{cs}

Wire `OnSubscribed` during `Register` only. It fires on the courier thread.

## Commands

```csharp
void AddCommandHandler<TArgs, TResult>(string command, Func<TArgs, TResult> handler);
void AddVantageCommandHandler<TArgs, TResult>(string command, Func<TArgs, string, TResult> handler);
void AddGateEvaluator(ICommandGateEvaluator evaluator);
void AddCommandRequirement(string command, CommandRequirement requirement);
```

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#commands{cs}

The vantage variant passes the id of the command centre the request entered from, resolved at the boundary rather than taken from the payload. See [Commands](/reference/mod/commands).

## Delay and connectivity

```csharp
void SetSignalDelaySource(Func<KspSnapshot?, CommsDelay?> computeOnMainThread);
void SetVesselDelay(string vesselId, double oneWaySeconds);
void SetAuthorityDelay(string centreId, string vesselId, double oneWaySeconds);
void SetCentreDelay(string fromCentreId, string toCentreId, double oneWaySeconds);
void SetVesselConnectivity(string vesselId, bool connected);
void SetConnectivitySource(Func<KspSnapshot?, bool?> computeOnMainThread);
```

Only for an Uplink integrating a communications mod. These set the delay every other Uplink's `Delayed` Topics and commands are subject to, so setting them wrongly desynchronises the whole dashboard.

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#delay{cs}

## Availability and capabilities

```csharp
void SetAvailability(Availability availability);
Kernel Kernel { get; }
```

See [ISitrepUplink](/reference/mod/) and [Kernel](/reference/mod/kernel).
