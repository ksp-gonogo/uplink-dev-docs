# A widget

The client is a package the Gonogo app loads into its own page, so a widget is a React component registered with the app, reading Topics through the SDK. This page walks the heartbeat widget from its registration to what it draws.

## The client's identity

`client/src/uplink.ts`:

<<< ../../example/client/src/uplink.ts#client

`defineUplinkClient` declares the client and returns its handle, an `UplinkClientHandle`. Its `id` must equal the plugin's, and its `version` the version in `package.json`. Every registration names the handle as its `owner`, so the app knows which Uplink a widget belongs to, and the handle registers what only an Uplink has, such as a [reckoner](/guide/reckoners). The `description` opens the Uplink's generated page ([Documenting your Uplink](/guide/documenting)).

## The entry

`client/src/index.ts`:

<<< ../../example/client/src/index.ts

`src/index.ts` is what the bundle starts from, and the app runs it once when it loads the client. Registering happens as a module loads, so the entry imports every file that registers something; a file nothing imports never registers. The scaffold's entry imports `topics.js` and `Heartbeat/index.js`; the line importing `reckoner.js` is added on [Writing a reckoner](/guide/reckoners).

## Typing the Topics {#the-topics-typed}

`client/src/topics.ts`:

<<< ../../example/client/src/topics.ts#maps

The SDK types every core Topic in `TopicPayloadMap`. Your Uplink's Topics join it through this `declare module` block, with the payload types `codegen` generated from your contract slice, so `useTelemetry("example.heartbeat")` is typed exactly like a core Topic and a misspelt name does not compile. Add a line here for each Topic you add to the plugin. The other imports serve the unit and command registrations further down the file, which [Publishing a Topic](/guide/topics#generating-the-client-s-types) and [Sending a command](/guide/client-commands#the-command-known-at-runtime) cover. The commands' half of the block is [Sending a command](/guide/client-commands).

## Registering the widget

At the foot of `client/src/Heartbeat/index.tsx`:

<<< ../../example/client/src/Heartbeat/index.tsx#register

`registerComponent` adds the widget to the app's widget list. The `ComponentDefinition` it takes says:

- what the operator sees in that list: `name`, `description` and `tags`, free-form words the list filters by, such as `"telemetry"` or `"control"`, styling the ones it knows
- how big a new tile is, in grid units: `defaultSize` and `minSize`. A column is about 32 pixels wide ([`COL_WIDTH`](/reference/ui-kit/Layout#COL_WIDTH))
- the `component` to render, and the `owner`
- `channels`: every Topic the widget reads. Listing a Topic does not subscribe to it, since `useTelemetry` does that, but when the Uplink serving it reports itself degraded or unavailable the dashboard draws that Uplink's reason in place of the widget, and the generated page lists it

`defaultConfig` and `actions` are optional, and empty here. A widget with settings the operator can change gives a [`configComponent`](/reference/client/registering#ComponentDefinition.configComponent) and its starting `defaultConfig`; a widget a key or a controller can drive declares its [`actions`](/reference/client/registering#ComponentDefinition.actions). Each widget id is unique across every Uplink, so start it with your Uplink's id.

## Reading a Topic

The widget itself, `client/src/Heartbeat/index.tsx`:

<<< ../../example/client/src/Heartbeat/index.tsx#widget

This is the finished widget. The one `new` writes is the same less three things the later pages add: the `useCommand` line, the `resetButton` and `panelAside` ([Sending a command](/guide/client-commands)); the `reckoning` lines and `ModelledAlongside` ([Writing a reckoner](/guide/reckoners)); and the two sentences of its doc comment and description that mention them.

`useTelemetry` returns the Topic's `TopicReading`: its latest value together with how current that value is. `state` is one of:

<!--@include: @/.vitepress/includes/reading-states.md-->

The widget `new` writes draws the values while the reading is observed or [held](/reference/concepts/held), and says which of the other three it is otherwise, never a zero: a value you have not received is not a value of zero, and the two mean opposite things to an operator. The example adds the modelled count and the reset button to it.

Each payload field is also on the reading as a `Reading` of its own, `heartbeat.ticks` beside `heartbeat.value.ticks`. Hand that to `Unit`, never the bare value: the field reading carries its own state, so `Unit` draws a held value with the held mark, and the null token when there is no value.

The same goes for a list. An array field is read by index, so each item's fields are readings too, with the Topic's state: `crew.crew[index].experienceLevel` below is one crew member's level, and `Unit` marks it held with the rest. An item taken from `crew.value.crew` holds bare `Value`s, which `Unit` draws as a plain number with no mark, so a list that stopped updating would look current. Map over the payload for the items, and read each figure off the reading:

<<< ../../reference/examples/guide/CrewLevels.tsx

Each item type needs its units registered, which `src/topics.ts` already does for every wire type ([Publishing a Topic](/guide/topics#generating-the-client-s-types)).

In the heartbeat, `ModelledAlongside` and the `reckoning` lines draw this Uplink's model beside the count received ([Writing a reckoner](/guide/reckoners)), and the reset button is [Sending a command](/guide/client-commands).

## A text field

`Unit` draws quantities only: a field the contract slice tags `Units.Text` arrives as a `Reading` of a string, which `Unit` does not take. Draw it with the same care by hand: the null token with no value, and the held mark on a value that stopped updating, which `derivedMarking` reads off the reading and `HeldFigure` draws.

<<< ../../reference/examples/guide/VesselName.tsx

## Drawing it

The widget is drawn entirely from `@ksp-gonogo/ui-kit`, the components the app's own widgets use, so it looks like them and reflows the way they do when the operator resizes its tile:

- **`Panel`** is the widget's frame: `panelTitle` its heading, `sections` its body, `panelAside` a control in its header
- [**`Section`**](/reference/ui-kit/Layout#Section) groups a body's content, and the panel lays sections out in columns when the tile is wide enough
- **`Unit`** draws a quantity with its symbol, choosing the unit from the value's size (`format` pins one, `as` converts to another of the same kind), so hand it values as they arrived
- **`Text`** draws a string you have already formatted
- **`EmptyState`** says why there is nothing to show

The [ui-kit reference](/reference/ui-kit/) has a page for every component, each with a live example.

## Accessibility

The kit's components carry their own roles and states, and honour a reader's reduced-motion setting. What is left to you:

- Give a control that shows only an icon an `aria-label`
- Never put streaming telemetry in a live region: a value that changes every second floods a screen reader
- Keep keyboard focus visible on anything you draw yourself

## Seeing it

`npm test` renders the widget in its tests. To see it drawn, `npm run render` draws each of the widget's fixtures, the scenes under `__fixtures__/`, to `client/renders/` in a real browser, which needs Chromium installed once with `npx playwright install chromium`. [Testing](/guide/testing) covers fixtures, and [Releasing and installing](/guide/release) how to see the widget in the app.

Next: [Sending a command](/guide/client-commands).
