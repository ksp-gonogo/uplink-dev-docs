# Commands

`Sitrep.Contract`

## Declaring

```csharp
public sealed class CommandDeclaration
{
    public string Command { get; set; }
    public DelayRole Delay { get; set; } = DelayRole.Delayed;
    public CommandRequirement[] Requires { get; set; }
    public string Subject { get; set; }
}
```

Every command you handle must be declared in `UplinkManifest.Commands`. Registering a handler for an undeclared command throws at startup.

## Delay

```csharp
[AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
public sealed class SitrepCommandAttribute : Attribute
{
    public SitrepCommandAttribute(string commandId);
    public string CommandId { get; }
    public DelayRole Delay { get; set; } = DelayRole.Delayed;
    public Type Payload { get; set; }
    public Type Result { get; set; }
}
```

A command's delay is read from the `[SitrepCommand]` tag on its arguments class, found by reflection over every loaded assembly that references `Sitrep.Contract`. It is the same `DelayRole` a channel declares: `Delayed` takes effect when the signal would have arrived, `TrueNow` only for actions that do not travel.

<<< ../../../template/mod/ExampleUplink/Payloads.cs#args{cs}

`CommandDeclaration.Delay` is consulted only for a command id no tag names, so tag the arguments class and leave the declaration's `Delay` alone. One arguments class can carry several tags, one per command it serves.

## Subject

The Topic whose vessel the command addresses, which decides whose light-time it waits for, whose blackout holds it, and which vessel it reaches. It must name a channel, or a [dynamic namespace](/reference/mod/host#dynamic-topics) Topic with an `{args.X}` segment filled from the arguments, that some Uplink declares.

A `Delayed` command with no `Subject`, or one that resolves to nothing, marks your Uplink unavailable once every Uplink has registered. It never falls back to the active vessel. A `TrueNow` command needs none.

## Handlers

```csharp
void AddCommandHandler<TArgs, TResult>(string command, Func<TArgs, TResult> handler);
void AddVantageCommandHandler<TArgs, TResult>(string command, Func<TArgs, string, TResult> handler);
```

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#commands{cs}

The vantage variant's extra `string` is the id of the command centre the request entered from, resolved at the boundary. Do not take an origin from the payload; a client can put anything there.

The shipped mod marshals a handler onto the Unity main thread and blocks the calling thread until it returns, so a handler may call the game directly and must return promptly. `Sitrep.Contract` does not promise that, and a host built the other way runs handlers on the courier thread.

## Argument binding

Arguments arrive as generic JSON (objects as dictionaries, all numbers as `double`) and are bound onto `TArgs` by reflection over its writable properties, matching names case-insensitively.

| Case | Result |
| --- | --- |
| Key absent | Property left at its default, so an absent nullable stays null |
| Enum | Binds from the numeric value or the member name |
| `string` | Accepts only a string |
| `bool` | Accepts only a bool |
| Unconvertible | Throws, disabling that command's Uplink |

A command with no arguments still needs a class of its own to bind onto.

## Results

```csharp
public class CommandResult
{
    public bool Success { get; set; } = true;
    public RefusalCode? ErrorCode { get; set; }
    public string? Reason { get; }
    public LimitBreach? Breach { get; set; }
    public string? Detail { get; set; }

    public static CommandResult Ok();
    public static CommandResult Fail(RefusalCode errorCode);
    public static CommandResult Fail(RefusalCode errorCode, string? detail);
    public static CommandResult Fail(RefusalCode errorCode, LimitBreach breach);
}

public class CommandResult<T> : CommandResult
{
    public T? Payload { get; set; }

    public static CommandResult<T> Ok(T payload);
    public static new CommandResult<T> Fail(RefusalCode errorCode);
    public static new CommandResult<T> Fail(RefusalCode errorCode, string? detail);
    public static new CommandResult<T> Fail(RefusalCode errorCode, LimitBreach breach);
}
```

<<< ../../../template/mod/ExampleUplink/ExampleUplink.cs#command{cs}

On the wire, `result` is:

```json
{ "success": false, "errorCode": "range", "detail": "...", "payload": ... }
```

`errorCode` and `reason` appear only on a failure, `detail` only when non-empty, `breach` only when set, and `payload` only for `CommandResult<T>`. The payload goes through the Topic serialiser, so it is a dictionary, a list, or a primitive.

## Refusal codes

```csharp
public sealed class RefusalCode : IEquatable<RefusalCode>
{
    public string Id { get; }
    public RefusalCode? Refines { get; }
    public string Sentence { get; }
    public RefusalCode Root { get; }
    public bool IsRoot { get; }

    public RefusalCode Refine(string id, string sentence);
}
```

`CommandErrorCode` holds the root refusals as `RefusalCode` fields. The id, not the field name, is what crosses the wire.

| Field | Id | Field | Id |
| --- | --- | --- | --- |
| `NoVessel` | `noVessel` | `WrongState` | `wrongState` |
| `ModeUnavailable` | `modeUnavailable` | `NotClearToProceed` | `notClearToProceed` |
| `Range` | `range` | `CapabilityMismatch` | `capabilityMismatch` |
| `NotFound` | `notFound` | `NoConnection` | `noConnection` |
| `PlanNotOwned` | `planNotOwned` | `NotUnlocked` | `notUnlocked` |
| `LimitReached` | `limitReached` | `SiteOccupied` | `siteOccupied` |
| `AlreadyAtMaximum` | `alreadyAtMaximum` | `FacilityDamaged` | `facilityDamaged` |
| `InsufficientFunds` | `insufficientFunds` | `InsufficientResource` | `insufficientResource` |
| `InsufficientScience` | `insufficientScience` | `Unreadable` | `unreadable` |
| `CareerModeRequired` | `careerModeRequired` | `OutOfReach` | `outOfReach` |
| `WrongScene` | `wrongScene` | | |

Pick the specific code. The client shows its sentence, and a vague one tells the operator nothing they can act on.

When a root is true but you can say more, refine it, as a `public static readonly RefusalCode` field on a static class of your own: `CommandErrorCode.WrongState.Refine("exampleUplink.notDeployed", "the antenna is not deployed")`. The id is `owner.name`, and the owner must be your own Uplink id; the host drops the codes of an Uplink that declares under anyone else's. The root still travels as `errorCode` and the refinement as `reason`, so a client that knows only the roots still reads a correct refusal.

**The published SDK does not match.** `@ksp-gonogo/sitrep-sdk@0.0.1` declares `CommandErrorCode` as an integer enum of seven members, `None` through `Timeout`, while the wire carries the string id. Handle an unrecognised code, and put anything the operator needs to read into `Detail`.

## Gates

Declarative preconditions checked before your handler runs.

```csharp
public class CommandRequirement
{
    public string Kind { get; set; }
    public string Facility { get; set; }
    public string Quantity { get; set; }
    public string[] Needs { get; set; }
}

public interface ICommandGateEvaluator
{
    string Kind { get; }
    GateVerdict Evaluate(CommandRequirement requirement, IGateArguments arguments);
}

public interface IGateArguments
{
    bool TryGet(string path, out object value);
}
```

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#gate{cs}

Register the evaluator and attach the requirement:

```csharp
host.AddGateEvaluator(new AlwaysPassGate());
host.AddCommandRequirement("example.setMode", new CommandRequirement { Kind = "example.gate" });
```

```csharp
public enum GateOutcome { Pass, Fail, Abstain, Unknown }

public class GateVerdict
{
    public GateOutcome Outcome { get; set; }
    public RefusalCode? ErrorCode { get; set; }
    public string? Reason { get; }
    public LimitBreach? Breach { get; set; }
    public string Detail { get; set; }

    public static GateVerdict Pass();
    public static GateVerdict Fail(LimitBreach breach);
    public static GateVerdict Fail(RefusalCode errorCode, LimitBreach breach);
    public static GateVerdict Fail(string detail);
    public static GateVerdict Fail(RefusalCode errorCode, string detail);
    public static GateVerdict Unknown(string detail);
}
```

**Never return `Abstain`.** Abstention is decided from the requirement's `Needs` before your evaluator is called.

A requirement whose `Kind` has no registered evaluator, or that names a command nobody declared, is a startup failure.

## LimitBreach

```csharp
public class LimitBreach
{
    public string Facility { get; set; }
    public string FacilityName { get; set; }
    public double FacilityLevel { get; set; }
    public string Quantity { get; set; }
    public double? Limit { get; set; }
    public double? Actual { get; set; }
    public string Unit { get; set; }
}
```

Attach one when a refusal is a numeric limit, so the client can say what the limit was and how far over it you were rather than repeating a sentence.
