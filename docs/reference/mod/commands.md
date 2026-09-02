# Commands

`Sitrep.Contract`

## Declaring

```csharp
public sealed class CommandDeclaration
{
    public string Command { get; set; }
    public bool Delayed { get; set; } = true;
    public CommandRequirement[] Requires { get; set; }
}
```

Every command you handle must be declared in `UplinkManifest.Commands`. Registering a handler for an undeclared command throws at startup.

`Delayed = true` makes the command take effect when the signal would have arrived. Set it `false` only for actions that do not travel.

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
    public CommandErrorCode ErrorCode { get; set; } = CommandErrorCode.None;
    public LimitBreach? Breach { get; set; }
    public string? Detail { get; set; }

    public static CommandResult Ok();
    public static CommandResult Fail(CommandErrorCode errorCode);
    public static CommandResult Fail(CommandErrorCode errorCode, string? detail);
    public static CommandResult Fail(CommandErrorCode errorCode, LimitBreach breach);
}

public class CommandResult<T> : CommandResult
{
    public T? Payload { get; set; }

    public static CommandResult<T> Ok(T payload);
    public static new CommandResult<T> Fail(CommandErrorCode errorCode);
    public static new CommandResult<T> Fail(CommandErrorCode errorCode, string? detail);
    public static new CommandResult<T> Fail(CommandErrorCode errorCode, LimitBreach breach);
}
```

<<< ../../../template/mod/ExampleUplink/ExampleUplink.cs#command{cs}

On the wire, `result` is:

```json
{ "success": true, "errorCode": 0, "detail": "...", "payload": ... }
```

`detail` appears only when non-empty, `breach` only when set, and `payload` only for `CommandResult<T>`. The payload goes through the Topic serialiser, so it is a dictionary, a list, or a primitive.

## CommandErrorCode

| Value | Code | Value | Code |
| --- | --- | --- | --- |
| 0 | `None` | 11 | `InsufficientScience` |
| 1 | `Unknown` | 12 | `CareerModeRequired` |
| 2 | `NoVessel` | 13 | `WrongScene` |
| 3 | `ModeUnavailable` | 14 | `WrongState` |
| 4 | `Range` | 15 | `NotClearToProceed` |
| 5 | `NotFound` | 16 | `CapabilityMismatch` |
| 6 | `Timeout` | 17 | `NoConnection` |
| 7 | `PlanNotOwned` | 18 | `NotUnlocked` |
| 8 | `LimitReached` | 19 | `SiteOccupied` |
| 9 | `AlreadyAtMaximum` | 20 | reserved |
| 10 | `InsufficientFunds` | 21 | `NotReady` |

Pick the specific code. The client shows it, and `Unknown` tells the operator nothing they can act on.

The numbers matter because the value, not the name, is what crosses the wire.

**The published SDK knows only the first seven**, `None` through `Timeout`. Anything from `PlanNotOwned` up arrives on the client as a number its `CommandErrorCode` enum cannot name, so a reverse lookup gives `undefined`. Handle an unrecognised code, and put anything the operator needs to read into `Detail`.

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
    public CommandErrorCode ErrorCode { get; set; }
    public LimitBreach? Breach { get; set; }
    public string Detail { get; set; }

    public static GateVerdict Pass();
    public static GateVerdict Fail(LimitBreach breach);
    public static GateVerdict Fail(CommandErrorCode errorCode, LimitBreach breach);
    public static GateVerdict Fail(string detail);
    public static GateVerdict Fail(CommandErrorCode errorCode, string detail);
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
