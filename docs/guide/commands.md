# Accepting a command

A command is a named request from a client, with typed arguments and a typed result.

## Declaring

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#manifest{cs}

`Delayed = true` makes the command ride the light-time delay: it takes effect when the signal would have arrived. Set it `false` only for things that do not travel, such as ground-facility actions.

Registering a handler for a command you did not declare throws at startup.

## The arguments class

<<< ../../template/mod/ExampleUplink/Payloads.cs#args{cs}

Arguments arrive as generic JSON and are bound onto this class by property name, case-insensitively:

- A key you did not send leaves that property at its default, so an absent nullable stays null rather than becoming zero
- Enums bind from their numeric value, or from the member name
- `string` accepts only a string and `bool` only a bool. Numbers are not coerced into either

## The handler

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#command{cs}

Return `CommandResult.Ok()`, or `CommandResult.Fail(code, detail)` with a code from `CommandErrorCode`. Use `CommandResult<T>.Ok(payload)` to return data.

**A handler does not run on the main thread.** `Sitrep.Contract` offers no way to marshal onto it, so a handler that must call the game records the request and lets the next main-thread capture apply it:

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#sampling{cs}

The cost is latency of up to one sample interval, and the operator sees the effect on the next frame either way.

## Validate in the handler

Check ranges and state before you accept, and return a specific code. `CommandErrorCode` has values for the common refusals: `Range`, `NotFound`, `NoVessel`, `WrongScene`, `WrongState`, `InsufficientFunds`, `NotUnlocked`, `NoConnection`. The client shows the code.

Next: [Build and install](/guide/build).
