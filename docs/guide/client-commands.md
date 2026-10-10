# Sending a command

The plugin now accepts `example.reset` ([Accepting a command](/guide/commands)). This page gives the client its types and a button that sends it.

## Typing the command

In `client/src/topics.ts`, the commands' half of the `declare module` block the Topics use, which `new` already wrote, so there is nothing to add:

<<< ../../example/client/src/topics.ts#commandmaps

The SDK types every core command's arguments in `CommandArgsMap` and its reply in `CommandReplyMap`. Your commands join them through the two maps `codegen` writes into `client/src/__generated__/command-map.ts`, one row per `SitrepCommandAttribute` in the contract slice: the arguments type it generated, and the reply, `CommandResult` for a handler that returns `CommandResult` or `CommandResultOf` the payload type for one that returns data. A command you add to the slice is typed after `npm run codegen`, with no line of yours to add.

## Registering the command {#the-command-known-at-runtime}

Further down `client/src/topics.ts`:

<<< ../../example/client/src/topics.ts#command

The declaration types the command; `registerUplinkCommand` makes the app know it exists at runtime. Its second argument, a `CommandRail`, says how the command travels, its rail: whether it waits for the signal delay (`delayed`) and whether a reply comes back (`replies`). `GENERATED_COMMAND_RAIL` holds the rail each command's `SitrepCommandAttribute` declares in the contract slice, and the loop registers every generated command with it, so the app and the plugin agree. The app uses it to show the operator whether a sent command is still crossing the signal delay.

Keep the loop `new` wrote. Without it nothing fails: the command still sends, but the app does not know how it travels, so it draws every command as one that crosses the signal delay and expects a reply, whatever its attribute says.

## Sending it

In the widget, `client/src/Heartbeat/index.tsx`, with the `useCommand` line beside the widget's other hooks and the button built before its `return`:

<<< ../../example/client/src/Heartbeat/index.tsx#button

The widget passes it to its `Panel` as `panelAside={resetButton}`, a control in the panel's header, and imports `useCommand` from `@ksp-gonogo/sitrep-sdk` and `CommandButton` from `@ksp-gonogo/ui-kit` ([the whole widget](/guide/client-widget#reading-a-topic)). `useCommand("example.reset")`, above it in the widget, returns a handle for one command, a `UseCommandResult`. Its `send` takes the arguments and resolves with the reply once the command has run: a delayed command to a distant craft can take minutes. When the plugin refuses it, `send` rejects with an error carrying the `CommandErrorCode` the handler returned, which `classifyCommandRejection` reads, and when no reply comes back it rejects too. Both are also recorded on the handle, so a `send` you do not wait on loses nothing.

Hand the handle to a `CommandButton` rather than wiring a plain button's click to `send`. The button shows where the command is, as its [`CommandButtonPhase`](/reference/ui-kit/CommandButton#CommandButtonPhase): `"idle"` at rest, `"armed"`, `"pending"` while it travels, `"refused"` with the reason, `"lost"` when no reply came, `"found"` when a lost command replies after all, or `"blocked"` by a requirement the mod checks before sending. It announces each outcome to a screen reader. `commandLabel` is what a refusal is named after.

## Destructive commands

A core command that stages, jettisons, spends or ends something, such as `vessel.control.stage` (every core command and its arguments are in [`CommandArgsMap`](/reference/client/commands#CommandArgsMap)), cannot be recalled once it is sent, and under a signal delay the operator may not see its effect for minutes. Give its button a `confirmLabel`: the first press arms it, the second sends, and an armed button left alone for four seconds ([`ARM_TIMEOUT_MS`](/reference/ui-kit/CommandButton#ARM_TIMEOUT_MS)) returns to rest:

<<< ../../reference/examples/guide/StageButton.tsx

A resolved `send` means the plugin ran the handler, not that the game is now in the state you asked for. Read the state back off its Topic, as the heartbeat's count shows the reset.

Next: [Writing a reckoner](/guide/reckoners).
