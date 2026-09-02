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

**Handlers do not run on the main thread**, and there is no way to get onto it. A handler that must call the game records the request for the next main-thread capture to apply.

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

## CommandErrorCode

```csharp
public enum CommandErrorCode
{
    None, Unknown, NoVessel, ModeUnavailable, Range, NotFound, Timeout,
    PlanNotOwned, LimitReached, AlreadyAtMaximum, InsufficientFunds,
    InsufficientScience, CareerModeRequired, WrongScene, WrongState,
    NotClearToProceed, CapabilityMismatch, NoConnection, NotUnlocked,
    SiteOccupied, /* reserved */ , NotReady,
}
```

Pick the specific code. The client shows it, and `Unknown` tells the operator nothing they can act on.

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
