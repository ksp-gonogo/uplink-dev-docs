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
    public Func<object?, bool>? IsKeyframe { get; set; }
    public bool PerVesselNode { get; set; } = false;
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

A quantum is the main lever you have on bandwidth. Set it to the smallest change an operator could act on, not to the smallest change your source can report.

## AbsenceIsData

Default `false`: a Topic that has never emitted a real value stays silent when its source returns null, and the client shows the Topic as still syncing.

Set it `true` when a null is itself the reading: no target selected, nothing docked, nobody aboard. The Topic then emits an empty frame from the first tick, and the client can show "no data" instead of waiting forever.

The distinction is between "the subject is present and the answer is nothing" and "there is no subject yet". Only the first is data.

## IsKeyframe

An optional predicate over a payload, answering "is this value self-contained?".

It only matters for a Topic whose frames are diffs against a previous frame. A subscriber joining late is caught up from the most recent value; if that value is a diff with no baseline, the client renders corruption. With this predicate set, the catch-up resolves to the last frame it returned `true` for.

Leave it null for a Topic whose every frame stands alone.

## PerVesselNode

Only meaningful on the template of a [dynamic namespace](/reference/mod/host#dynamic-topics), where each sub-topic is keyed by a vessel. It routes each sub-topic through that vessel's own delay.

Without it, a sub-topic about a vessel you are not flying is delayed by the vessel you are flying, which is usually less. Nothing errors and nothing goes missing; the value simply turns up early carrying the wrong craft's light-time.

It is ignored on a static declaration, whose one Topic is not keyed by anything.

## Every field at once

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#declarations{cs}

## Naming

`<uplinkId>.<thing>`, lower camel after the dot: `example.status`, `example.linkMargin`. The prefix is all that separates you from every other installed Uplink.
