# Sending a command

A command is a request with a `requestId` you generate, answered by a `command-response` carrying the same id. The `command` method on the [template client](/guide/client-stream) sends the frame and resolves when the matching response arrives.

## The result is untyped

`command-response.result` is `unknown` on the wire. Nothing links a command name to its result type, so the cast is yours:

<<< ../../template/client/src/sendCommand.ts#result

`errorCode` is the id of the plugin's refusal, a string such as `"range"`, and is absent on success. The SDK's `CommandErrorCode` maps each root refusal to its id, so compare against its members rather than against a bare string.

## A command does not resolve when it takes effect

It resolves when the plugin's handler returns. For a `Delayed` command that is after the light-time delay has elapsed, so on an interplanetary vessel the promise can be minutes in flight.

Two consequences for the UI:

- Show the control as pending for the whole wait, not for a spinner's worth of it
- Do not treat the resolved result as proof of the new state. Read the state back off its Topic

## Confirm anything destructive

The delay makes a mistaken command unrecallable. Arm-then-confirm, rather than a bare click, for anything that stages, jettisons, terminates, or spends. `CommandButton` carries that step for you: give it a `confirmLabel` and the first press arms it, the second sends, and an arm left alone expires.

Next: [Building the UI](/guide/client-ui).
