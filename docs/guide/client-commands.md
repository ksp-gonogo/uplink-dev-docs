# Sending a command

The plugin now accepts `example.reset` ([Accepting a command](/guide/commands)). This page gives the client its types and a button that sends it.

## The command, typed

In `client/src/topics.ts`, the same `declare module` block as the Topics':

<<< ../../example/client/src/topics.ts#maps

The SDK types every core command's arguments in `CommandArgsMap` and its reply in `CommandReplyMap`. Your commands join them through the two maps `codegen` writes into `client/src/__generated__/command-map.ts`, one row per `SitrepCommandAttribute` in the contract slice: the arguments type it generated, and the reply, `CommandResult` for a handler that returns `CommandResult` or `CommandResultOf` the payload type for one that returns data. A command you add to the slice is typed after `npm run codegen`, with no line of yours to add.

## The command, known at runtime

Further down `client/src/topics.ts`:

<<< ../../example/client/src/topics.ts#command

The declaration types the command; `registerUplinkCommand` makes the app know it exists at runtime. Its second argument, a `CommandRail`, says how the command travels: whether it waits for the signal delay (`delayed`) and whether a reply comes back (`replies`). The generated map's rail is read off the same attribute the plugin's host dispatches by, so the two always agree. The app uses it to show the operator whether a sent command is still crossing the signal delay.

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
