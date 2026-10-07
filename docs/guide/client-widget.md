# A widget

The client is a package the Gonogo app loads into its own page, so a widget is a React component registered with the app, reading Topics through the SDK. This page walks the heartbeat widget from its registration to what it draws.

## The client's identity

<<< ../../example/client/src/uplink.ts#client

`defineUplinkClient` declares the client and returns its handle, an `UplinkClientHandle`. Its `id` must equal the plugin's, and its `version` the version in `package.json`. Every registration names the handle as its `owner`, so the app knows which Uplink a widget belongs to, and the handle registers what only an Uplink has, such as a [reckoner](/guide/reckoners). The `description` opens the Uplink's generated page ([Documenting your Uplink](/guide/documenting)).

## The entry

<<< ../../example/client/src/index.ts

`src/index.ts` is what the bundle starts from, and the app runs it once when it loads the client. Registering happens as a module loads, so the entry imports every file that registers something; a file nothing imports never registers.

## The Topics, typed

<<< ../../example/client/src/topics.ts#maps

The SDK types every core Topic in `TopicPayloadMap`. Your Uplink's Topics join it through this declaration, with the payload types `codegen` generated from your contract slice, so `useTelemetry("example.heartbeat")` is typed exactly like a core Topic and a misspelt name does not compile. Add a line here for each Topic you add to the plugin. The commands' half of this block is [Sending a command](/guide/client-commands).

## Registering the widget

<<< ../../example/client/src/Heartbeat/index.tsx#register

`registerComponent` adds the widget to the app's widget list. The `ComponentDefinition` it takes says what the operator sees in that list (`name`, `description`, `tags`), how big a new tile is in grid units (`defaultSize`, `minSize`), the component to render, and `channels`: every Topic the widget reads. Listing a Topic does not subscribe to it, since `useTelemetry` does that, but it lets the dashboard draw the reason in place of the widget when the Uplink serving that Topic reports itself unavailable, and the generated page lists it. Each widget id is unique across every Uplink, so start it with your Uplink's id.

## Reading a Topic

<<< ../../example/client/src/Heartbeat/index.tsx#widget

`useTelemetry` returns the Topic's `TopicReading`: its latest value together with how current that value is. `state` is one of:

| `state` | Meaning |
| --- | --- |
| `"observed"` | The newest value that could have reached the operator. `value` holds it |
| `"held"` | Updates stopped arriving, such as across a loss of signal. `value` holds the last one received |
| `"pending"` | Nothing has arrived yet |
| `"absent"` | The game confirmed there is no value, such as no target set |
| `"unowned"` | Nothing will ever publish this Topic: no installed Uplink declares it |

So check `state` before reading `value`, as the widget does: until the first sample arrives it shows `EmptyState`, never a zero. A value you have not received is not a value of zero, and the two mean opposite things to an operator.

Each payload field is also on the reading as a `Reading` of its own, `heartbeat.ticks` beside `heartbeat.value.ticks`. Pass that to a kit component such as `Unit` without checking anything: the reading carries its own state, and the component draws a held value as held. The `reckoning` lines are [Writing a reckoner](/guide/reckoners).

## Drawing it

The widget is drawn entirely from `@ksp-gonogo/ui-kit`, the components the app's own widgets use, so it looks like them and reflows the way they do when the operator resizes its tile:

- **`Panel`** is the widget's frame: `panelTitle` its heading, `sections` its body, `panelAside` a control in its header
- **`Section`** groups a body's content, and the panel lays sections out in columns when the tile is wide enough
- **`Unit`** draws a quantity with its symbol, in the unit the operator chose for that kind of quantity
- **`Text`** draws a string you have already formatted
- **`EmptyState`** says what the widget is waiting for

The [ui-kit reference](/reference/ui-kit/) has a page for every component, each with a live example.

## Accessibility

The kit's components carry their own roles and states, and honour a reader's reduced-motion setting. What is left to you:

- Give a control that shows only an icon an `aria-label`
- Never put streaming telemetry in a live region: a value that changes every second floods a screen reader
- Keep keyboard focus visible on anything you draw yourself

## Seeing it

`npm test` renders the widget in its test. To see it drawn, `npm run render` draws every fixture to `client/renders/` in a real browser, which needs Chromium installed once with `npx playwright install chromium`. [Testing](/guide/testing) covers fixtures, and [Releasing and installing](/guide/release) how to see it in the app.

Next: [Sending a command](/guide/client-commands).
