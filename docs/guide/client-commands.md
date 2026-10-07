# Sending a command

The plugin now accepts `example.reset` ([Accepting a command](/guide/commands)). This page gives the client its types and a button that sends it.

## The command, typed

In `client/src/topics.ts`, the same `declare module` block as the Topics':

<<< ../../example/client/src/topics.ts#maps

The SDK types every core command's arguments in `CommandArgsMap` and its reply in `CommandReplyMap`. Your commands join them as your Topics join `TopicPayloadMap`: the arguments type is the one `codegen` generated from the contract slice, and the reply is `CommandResult` for a handler that returns `CommandResult`, or `CommandResultOf` the payload type for one that returns data. `codegen` does not write these lines for you, unlike the types they name.

## The command, known at runtime

Further down `client/src/topics.ts`:

<<< ../../example/client/src/topics.ts#command

The declaration types the command; `registerUplinkCommand` makes the app know it exists at runtime. Its second argument, a `CommandRail`, says how the command travels, and must agree with the plugin: `delayed` is `false` for a `TrueNow` command and `true` for a `Delayed` one, and `replies` is `true` for a handler that returns a result. The app uses it to show the operator whether a sent command is still crossing the signal delay. The reference describes the rail as a row from an Uplink's generated command map; `codegen` writes no such map yet, so write the rail by hand as here ([Known limits](/guide/limits#the-client)).

Forget the call and nothing fails: the command still sends, but the app does not know how it travels and draws it as a single command that gets a reply.

## Sending it

In the widget, `client/src/Heartbeat/index.tsx`:

<<< ../../example/client/src/Heartbeat/index.tsx#button

`useCommand("example.reset")` (above it in the widget) returns a handle for one command, a `UseCommandResult`. Its `send` takes the arguments and resolves with the reply once the command has run: a delayed command to a distant craft can take minutes. When the plugin refuses it, `send` rejects with the `CommandErrorCode` the handler returned, and when no reply comes back it rejects too. Both are also recorded on the handle, so a `send` you do not wait on loses nothing.

Hand the handle to a `CommandButton` rather than wiring a plain button's click to `send`. The button shows where the command is, as its `CommandButtonPhase`: at rest, armed, pending while it travels, refused with the reason, lost when no reply came, found when a lost command replies after all, or blocked by a requirement the mod checks before sending. It announces each outcome to a screen reader. `commandLabel` is what a refusal is named after.

## Destructive commands

A command that stages, jettisons, spends or ends something cannot be recalled once it is sent, and under a signal delay the operator may not see its effect for minutes. Give its button a `confirmLabel`: the first press arms it, the second sends, and an armed button left alone for [`ARM_TIMEOUT_MS`](/reference/ui-kit/CommandButton#ARM_TIMEOUT_MS) returns to rest.

A resolved `send` means the plugin ran the handler, not that the game is now in the state you asked for. Read the state back off its Topic, as the heartbeat's count shows the reset.

Next: [Writing a reckoner](/guide/reckoners).
