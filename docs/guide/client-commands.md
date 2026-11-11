# Sending a command

The plugin now accepts `example.reset` ([Accepting a command](/guide/commands)). This page gives the client its types and a button that sends it.

## Typing the command

In `client/src/commands.ts`, which `new` already wrote, so there is nothing to add:

<<< ../../example/client/src/commands.ts#commandmaps

The snippets show the middle of the file. Its imports, which `new` wrote, are `registerUplinkCommand` from `@ksp-gonogo/sitrep-sdk` and `GENERATED_COMMAND_IDS`, `GENERATED_COMMAND_RAIL`, `GeneratedCommandArgsMap` and `GeneratedCommandReplyMap` from `./__generated__/command-map.js`.

The SDK types every core command's arguments in `CommandArgsMap` and its reply in `CommandReplyMap`. Your commands join them through the two maps `codegen` writes into `client/src/__generated__/command-map.ts`, one row per `SitrepCommandAttribute` in the contract slice: the arguments type it generated, and the reply, `CommandResult` for a handler that returns `CommandResult` or `CommandResultOf` the payload type for one that returns data. A command you add to the slice is typed after `npm run codegen`, with no line of yours to add. The file also exports `UPLINK_COMMAND_IDS`, this Uplink's own command ids as the generated map declares them, and `src/index.ts` re-exports it so a test or another package can name your commands without typing the strings.

## Registering the command {#the-command-known-at-runtime}

Further down the same file:

<<< ../../example/client/src/commands.ts#command

The declaration types the command; `registerUplinkCommand` makes the app know it exists at runtime. Its second argument, a `CommandRail`, says how the command travels, its **rail**: whether it waits for the signal delay (`delayed`) and whether a reply comes back (`replies`). The ui-kit's delay indicators, such as `CommandDelay`, are drawn from the rail. `GENERATED_COMMAND_RAIL` holds the rail each command's `SitrepCommandAttribute` declares in the contract slice, and the loop registers every generated command with it, so the app and the plugin agree. The app uses it to show the operator whether a sent command is still crossing the signal delay.

Keep the loop `new` wrote. Without it nothing fails: the command still sends, but the app does not know how it travels, so it draws every command as one that crosses the signal delay and expects a reply, whatever its attribute says.

## Sending it

In the widget, `client/src/Heartbeat/index.tsx`, with the `useCommand` line beside the widget's other hooks and the button built before its `return`:

<<< ../../example/client/src/Heartbeat/index.tsx#button

The widget passes it to its `Panel` as `panelAside={resetButton}`, a control in the panel's header, and imports `useCommand` from `@ksp-gonogo/sitrep-sdk` and `Button` from `@ksp-gonogo/ui-kit` ([the whole widget](/guide/client-widget#reading-a-topic)). `useCommand("example.reset")`, above it in the widget, returns a handle for one command, a `UseCommandResult`. A control the operator presses takes the handle through its `command` prop, as above. For a send that no control starts, its `dangerouslySendWithoutInput` takes the arguments and resolves with the reply once the command has run: a delayed command to a distant craft can take minutes. When the plugin refuses it, it rejects with an error carrying the `CommandErrorCode` the handler returned, which `classifyCommandRejection` turns into a `kind` such as `"refused"` with its `errorCode`, and when no reply comes back it rejects too. Both are also recorded on the handle, so a send you do not wait on loses nothing.

Give the handle to a `Button` as its `command` rather than wiring a plain button's click to `dangerouslySendWithoutInput`, which draws nothing for the operator. The button shows where the command is, as its [`CommandButtonPhase`](/reference/ui-kit/CommandButton#CommandButtonPhase), and announces each outcome to a screen reader. The `label` in the command's options (`reset.with(undefined, { label: "Reset the count" })`) is what a refusal is named after.

### What the operator sees

Every `Button` given a `command` draws these faces. Each phase is one the button wears, in the operator's terms:

| Phase | What the operator sees | What it means |
|---|---|---|
| `"idle"` | The button's label | Ready to press |
| `"armed"` | The `confirmLabel`, for 4 seconds | The first press of an arm-then-confirm button. A second press sends; left alone, the button returns to rest. Only reachable when `confirmLabel` is given |
| `"sent"` | "SENT", for at least half a second | The press went out and the mod has not answered yet. The button is live again once the mod answers; the command's journey to the vessel is shown by the panel's delay rail |
| `"refused"` | "Refused", for 8 seconds, with the reason as its tip | The game evaluated the command and said no. Pressing again changes nothing until the situation does |
| `"lost"` | "No reply" | Nothing came back. The game decided nothing and the command may still have run, so the button does not read as confirmed or as refused |
| `"found"` | "Found" | A command this button lost has replied after all. The operator may already have sent it again |
| `"blocked"` | The label, dimmed, with the reason as its tip | The button cannot be pressed: the mod's gate says the game will refuse it, or the caller gave an `unavailable` reason. It stays focusable, carries `aria-disabled`, and a press sends nothing. Only the game's own refusal gets a dashed warning edge |

Four more things change how a button looks without being a phase:

- **Unavailable**: when the caller gives an `unavailable` reason (a reading that has not arrived, say), the button is dimmed with a solid edge, the reason is its tip, and a press sends nothing
- **Offline**: when the stream to the mod is down, the button is dimmed with a dotted edge and a press does nothing until the stream returns. A command already in flight is not affected
- **Advised**: when the mod expects the game to refuse a command but cannot be sure, the button stays pressable, its tip says why, and its edge shows the command may be refused. A press sends it and the game decides on arrival. A command that takes no signal delay is stopped instead, and shows as blocked
- **Held and modelled** (on a toggle): while a press waits at a relay the state it will set is drawn marked held, and while it is predicted to have arrived it is marked modelled. The toggle shows "SENT", then the state again with the mark

The words are props: `confirmLabel`, `refusedLabel`, `lostLabel` and `foundLabel`. A button is sized to hold its widest word, so a state change never moves its neighbours.

## Commands with arguments

The reset command takes none. A command that does is sent by passing its arguments, typed from the contract slice's class by `codegen`: `handle.dangerouslySendWithoutInput({ value: 1 })` resolves with the reply, and a `Button` takes the same object through `handle.with(args)` in its `command` prop and sends it when pressed. One handle can serve several buttons, each with its own arguments. This sends the core command `vessel.control.setThrottle`, whose argument is `value`; an Uplink's own command, such as the `example.setMode` sketch on [Accepting a command](/guide/commands#a-command-about-a-craft), is sent the same way with `{ mode: 1 }`, the property names in camel case:

<<< ../../reference/examples/guide/ThrottleButtons.tsx

The plugin's side of a command with arguments, a class and a handler that reads `args.Mode`, is on [Accepting a command](/guide/commands#a-command-about-a-craft).

A handler that replies with data, such as that page's `example.setMode`, answers `dangerouslySendWithoutInput` with a reply whose `payload` holds the data, typed from the handler's `CommandResult<T>`. This sketch is not part of the worked Uplink, and calls `dangerouslySendWithoutInput` from a function such as a click handler:

```tsx
const setMode = useCommand("example.setMode");

async function chooseMode() {
  const reply = await setMode.dangerouslySendWithoutInput({ mode: 1 });
  // reply.payload holds the data
}
const mode = reply.payload; // the number the handler returned, or null when it returned none
```

## Destructive commands

A core command that stages, jettisons, spends or ends something, such as `vessel.control.stage` (every core command and its arguments are in [`CommandArgsMap`](/reference/client/commands#CommandArgsMap)), cannot be recalled once it is sent, and under a signal delay the operator may not see its effect for minutes. Give its button a `confirmLabel`: the first press arms it, the second sends, and an armed button left alone for four seconds ([`ARM_TIMEOUT_MS`](/reference/ui-kit/CommandButton#ARM_TIMEOUT_MS)) returns to rest:

<<< ../../reference/examples/guide/StageButton.tsx

A resolved send means the plugin ran the handler, not that the game is now in the state you asked for. Read the state back off its Topic, as the heartbeat's count shows the reset.

Next: [Writing a reckoner](/guide/reckoners).
