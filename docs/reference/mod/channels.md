# Channels

`Sitrep.Contract`

A channel declaration is one entry in `UplinkManifest.Channels`. It fixes how a Topic behaves before anything publishes on it.

```csharp
public sealed class ChannelDeclaration
{
    public string Topic { get; set; }
    public Delivery Delivery { get; set; } = Delivery.LossyLatest;
    public EmissionPolicy Emission { get; set; }
    public DelayRole Delay { get; set; } = DelayRole.Delayed;
    public bool AbsenceIsData { get; set; } = false;
    public bool NullIsUnreadable { get; set; } = false;
    public bool OpaquePayload { get; set; } = false;
    public Func<object?, bool>? IsKeyframe { get; set; }
    public bool PerVesselNode { get; set; } = false;
    public Func<string, string?>? VesselIdForKey { get; set; }
    public bool Recordable { get; set; } = true;
    public bool HeldAtHome { get; set; } = false;
}
```

<<< ../../../template/mod/ExampleUplink/ExampleUplink.cs#manifest{cs}

## Delivery

```csharp
public enum Delivery { LossyLatest, ReliableOrdered }
```

| Value | Behaviour |
| --- | --- |
| `LossyLatest` | A newer frame supersedes an undelivered older one. Correct for state. |
| `ReliableOrdered` | Every frame arrives, in order. Correct for occurrences that do not replace each other. |

Choose by asking whether skipping a frame loses information. An altitude reading: no. A staging event: yes.

## DelayRole

```csharp
public enum DelayRole { Delayed, TrueNow }
```

`Delayed` holds the frame for the light-time delay, so the operator sees the value when the signal would have reached them. `TrueNow` bypasses it.

Almost everything is `Delayed`. `TrueNow` is for facts that do not travel: a ground facility's state, or a bare flag saying whether the mod you integrate is installed.

Getting this wrong is not cosmetic. A `TrueNow` vessel reading tells the operator something they could not know yet.

## Emission

```csharp
public sealed class EmissionPolicy
{
    public double MinSampleIntervalUt { get; }
    public double KeyframeIntervalUt { get; }
    public EmissionQuantum Quantum { get; }
    public double MaxRateIntervalUt { get; }

    public EmissionPolicy(
        double keyframeIntervalUt,
        EmissionQuantum quantum,
        double minSampleIntervalUt = 0,
        double maxRateIntervalUt = 0);
}
```

| Parameter | Meaning |
| --- | --- |
| `keyframeIntervalUt` | Longest silence, in game seconds. A frame goes out at least this often even when nothing changed. |
| `quantum` | How far the value must move to emit before the keyframe is due. |
| `minSampleIntervalUt` | Floor between samples. Raise it for a value nobody needs at full cadence. |
| `maxRateIntervalUt` | Ceiling on emission rate, regardless of how fast the value moves. |

```csharp
public readonly struct EmissionQuantum
{
    public static EmissionQuantum Absolute(double quantum);
    public static EmissionQuantum PercentOfRange(double fraction, double rangeMin, double rangeMax);
    public double Resolve();
}
```

`Absolute(0)` emits on any change. `PercentOfRange(0.01, 0, 100)` emits when a percentage moves by one point.

`Emission` has no default. Set it on every declaration.

Every interval here is in UT, and time warp compresses UT into wall-clock time, so a policy that is comfortable at 1x emits at the warp multiple. There is no wall-clock clamp: `MaxRateIntervalUt` is UT like the rest.

A quantum is the main lever you have on bandwidth. Set it to the smallest change an operator could act on, not to the smallest change your source can report.

## AbsenceIsData

Default `false`: a Topic that has never emitted a real value stays silent when its source returns null, and the client shows the Topic as still syncing.

Set it `true` when a null is itself the reading: no target selected, nothing docked, nobody aboard. The Topic then emits an empty frame from the first tick, and the client can show "no data" instead of waiting forever.

The distinction is between "the subject is present and the answer is nothing" and "there is no subject yet". Only the first is data.

## NullIsUnreadable

Default `false`. The opposite reading of the same null, for a subject that keeps existing while the game stops being able to report it: a null means "no reading available", never "confirmed nothing". The channel emits nothing and goes quiet.

Silence is what the client reads as stale. Missed keyframes take the Topic to stale, carrying the last real value and when it was true, and a subscriber that joins during the silence gets that last value marked held-stale. An empty frame would instead tell the operator the subject has no value, which for a space centre's facilities means announcing it has no buildings.

It contradicts `AbsenceIsData`. Set both and this one wins, because a channel that cannot be read has nothing to announce.

## IsKeyframe

An optional predicate over a payload, answering "is this value self-contained?".

It only matters for a Topic whose frames are diffs against a previous frame. A subscriber joining late is caught up from the most recent value; if that value is a diff with no baseline, the client renders corruption. With this predicate set, the catch-up resolves to the last frame it returned `true` for.

Leave it null for a Topic whose every frame stands alone.

## PerVesselNode

Only meaningful on the template of a [dynamic namespace](/reference/mod/host#dynamic-topics), where each sub-topic is keyed by a vessel. It routes each sub-topic through that vessel's own delay.

Without it, a sub-topic about a vessel you are not flying is delayed by the vessel you are flying, which is usually less. Nothing errors and nothing goes missing; the value simply turns up early carrying the wrong craft's light-time.

It is ignored on a static declaration, whose one Topic is not keyed by anything.

## VesselIdForKey

For a per-vessel namespace whose key segment is not itself a vessel id. `PerVesselNode` otherwise reads the segment after the prefix as the vessel id, and a namespace keyed by something else, a processor id say, then routes to a node no delay is ever written for, which fails more quietly than the wrong delay.

Return the owning vessel's id for a key, or null for one you cannot place, which falls back to the active vessel. Never invent an id.

**It must not read live game state.** It runs on the courier thread while a Topic is resolved, and a Unity call from there throws. Keep a snapshot up to date in your own main-thread pass and read that.

## Recordable

Default `true`: while the vessel is out of contact its samples are held aboard and replayed when the signal returns, rather than discarded. That is the right reading of a `Delayed` channel, whose value the craft's own instruments produced and could have written down. A `TrueNow` channel is never held back, so this does not apply to it.

Set it `false` for a `Delayed` channel whose value was never aboard: the warp rate, the calendar, a list of every other craft. Replaying those would have the craft play back facts it could not observe. The first sample after an outage on a non-recording channel carries `Meta.gapSinceUt`, so the hole is stated rather than drawn through.

## HeldAtHome

Default `false`. Declares that the value is held at the home command centre, like a career ledger or the space centre's facilities, rather than aboard a craft. Each vantage then learns of a change after its own delay to home: a ground station at once, a crewed vessel after its path home. Loss of signal on the active vessel never freezes it.

It requires `Delay = DelayRole.Delayed`. With `TrueNow`, which reaches every vantage at once, the declaration is a contradiction and your Uplink is marked unavailable. It is ignored on a dynamic namespace template, which is per-vessel by definition.

## OpaquePayload

Default `false`. Set it `true` to carry the payload as raw byte segments on the [binary lane](/reference/client/binary-frames) instead of as JSON. The Topic must then publish a `byte[]` or an ordered collection of them, and anything else, null included, marks your Uplink unavailable.

It is never inferred. A `byte[]` on a channel without the flag goes out as a JSON number array.

## Every field at once

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#declarations{cs}

## Naming

`<uplinkId>.<thing>`, lower camel after the dot: `example.status`, `example.linkMargin`. The prefix is all that separates you from every other installed Uplink.
