# Sending a command

The plugin now accepts `example.reset` ([Accepting a command](/guide/commands)). This page gives the client its types and a button that sends it.

## The command, typed

<<< ../../example/client/src/topics.ts#maps

The SDK types every core command's arguments in `CommandArgsMap` and its reply in `CommandReplyMap`. Your commands join them the way your Topics join `TopicPayloadMap`: the arguments type is the one `codegen` generated from the contract slice, and the reply is `CommandResult` for a handler that returns `CommandResult`, or `CommandResultOf` the payload type for one that returns data.

## The command, known at runtime

<<< ../../example/client/src/topics.ts#command

The declaration types the command; `registerUplinkCommand` makes the app know it exists. Its second argument, a `CommandRail`, says how the command travels, and must agree with the plugin: `delayed` is `false` for a `TrueNow` command and `true` for a `Delayed` one, and `replies` is `true` for a handler that returns a result. The app uses it to show the operator whether a sent command is still crossing the signal delay.

## Sending it

<<< ../../example/client/src/Heartbeat/index.tsx#widget

`useCommand` returns a handle for one command, a `UseCommandResult`. Its `send` takes the arguments and resolves with the reply once the command has run: a delayed command to a distant craft can take minutes. When the plugin refuses it, `send` rejects with the `CommandErrorCode` the handler returned, and when no reply comes in time it rejects too. Both are also recorded on the handle, so a `send` you do not wait on loses nothing.

Hand the handle to a `CommandButton` rather than wiring a plain button's click to `send`. The button shows the whole life of the command: pending while it travels, then refused, or no reply, with the reason, and it announces each outcome to a screen reader. `commandLabel` is what a refusal is named after.

## Destructive commands

A command that stages, jettisons, spends or ends something cannot be recalled once it is sent, and under a signal delay the operator may not see its effect for minutes. Give its button a `confirmLabel`: the first press arms it, the second sends, and an armed button left alone returns to rest.

A resolved `send` means the plugin ran the handler, not that the game is now in the state you asked for. Read the state back off its Topic, as the heartbeat's count shows the reset.

Next: [Writing a reckoner](/guide/reckoners).
