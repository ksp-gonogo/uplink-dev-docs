# Accepting a command

A command is a named request from a client, with typed arguments and a typed result.

## Declaring

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#manifest{cs}

`Subject` names the Topic whose vessel the command is addressed to, so the command waits for that vessel's light-time. A delayed command without one marks your Uplink unavailable.

Registering a handler for a command you did not declare throws at startup.

## The arguments class

<<< ../../template/mod/ExampleUplink/Payloads.cs#args{cs}

The `[SitrepCommand]` tag names the command this class carries arguments for, and is where its delay is declared. It defaults to `Delayed`: the command rides the light-time delay and takes effect when the signal would have arrived. Write `[SitrepCommand("example.setMode", Delay = DelayRole.TrueNow)]` only for things that do not travel, such as ground-facility actions.

Arguments arrive as generic JSON and are bound onto this class by property name, case-insensitively:

- A key you did not send leaves that property at its default, so an absent nullable stays null rather than becoming zero
- Enums bind from their numeric value, or from the member name
- `string` accepts only a string and `bool` only a bool. Numbers are not coerced into either

## The handler

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#command{cs}

Return `CommandResult.Ok()`, or `CommandResult.Fail(code, detail)` with a code from `CommandErrorCode`.

**The shipped mod marshals a handler onto the Unity main thread before running it**, so a handler may call the game directly. The calling thread blocks until it does, which is why a handler must return promptly rather than waiting on anything itself.

`Sitrep.Contract` does not promise that marshalling; it is how the shipped host is built. If you want to be safe against a host that does not, record the request in a field and apply it from your main-thread capture, reading and writing that field with `Interlocked`.

## Returning data

`CommandResult<T>.Ok(payload)` puts `T` under a `payload` key beside `success` and `errorCode`, so the client reads `result.payload`. A non-generic `CommandResult` sends no `payload` key at all.

`T` goes through the same serialiser as a Topic payload, so it is a dictionary, a list, or a primitive. Not a class of your own.

## Validate in the handler

Check ranges and state before you accept, and return a specific code. `CommandErrorCode` has values for the common refusals: `Range`, `NotFound`, `NoVessel`, `WrongScene`, `WrongState`, `InsufficientFunds`, `NotUnlocked`, `NoConnection`. The client shows the code.

Next: [Build and install](/guide/build).
