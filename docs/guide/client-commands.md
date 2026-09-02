# Sending a command

A command is a request with a `requestId` you generate, answered by a `command-response` carrying the same id. The `command` method on the [template client](/guide/client-stream) sends the frame and resolves when the matching response arrives.

## The result is untyped

`command-response.result` is `unknown` on the wire. Nothing links a command name to its result type, so the cast is yours:

<<< ../../template/client/src/sendCommand.ts#result

`errorCode` is the plugin's `CommandErrorCode`, which the SDK exports as a real enum. Compare against its members rather than against a bare number.

## A command does not resolve when it takes effect

It resolves when the plugin's handler returns. For a `Delayed` command that is after the light-time delay has elapsed, so on an interplanetary vessel the promise can be minutes in flight.

Two consequences for the UI:

- Show the control as pending for the whole wait, not for a spinner's worth of it
- Do not treat the resolved result as proof of the new state. Read the state back off its Topic

## Confirm anything destructive

The delay makes a mistaken command unrecallable. Arm-then-confirm, rather than a bare click, for anything that stages, jettisons, terminates, or spends. `ActionButton`'s `go` tone exists for the confirm step.

Next: [Building the UI](/guide/client-ui).
