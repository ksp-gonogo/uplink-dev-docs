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

## The Topics, typed

`client/src/topics.ts`:

<<< ../../example/client/src/topics.ts#maps

The SDK types every core Topic in `TopicPayloadMap`. Your Uplink's Topics join it through this `declare module` block, with the payload types `codegen` generated from your contract slice, so `useTelemetry("example.heartbeat")` is typed exactly like a core Topic and a misspelt name does not compile. Add a line here for each Topic you add to the plugin. The commands' half of the block is [Sending a command](/guide/client-commands).

## Registering the widget

At the foot of `client/src/Heartbeat/index.tsx`:

<<< ../../example/client/src/Heartbeat/index.tsx#register

`registerComponent` adds the widget to the app's widget list. The `ComponentDefinition` it takes says:

- what the operator sees in that list: `name`, `description` and `tags`, words the list filters by
- how big a new tile is, in grid units: `defaultSize` and `minSize`. A column is about [`COL_WIDTH`](/reference/ui-kit/Layout#COL_WIDTH) pixels wide
- the `component` to render, and the `owner`
- `channels`: every Topic the widget reads. Listing a Topic does not subscribe to it, since `useTelemetry` does that, but when the Uplink serving it reports itself degraded or unavailable the dashboard draws that Uplink's reason in place of the widget, and the generated page lists it

`defaultConfig` and `actions` are optional, and empty here. A widget with settings the operator can change gives a [`configComponent`](/reference/client/registering#ComponentDefinition.configComponent) and its starting `defaultConfig`; a widget a key or a controller can drive declares its [`actions`](/reference/client/registering#ComponentDefinition.actions). Each widget id is unique across every Uplink, so start it with your Uplink's id.

## Reading a Topic

The widget itself, `client/src/Heartbeat/index.tsx`:

<<< ../../example/client/src/Heartbeat/index.tsx#widget

`useTelemetry` returns the Topic's `TopicReading`: its latest value together with how current that value is. `state` is one of:

| `state` | Meaning |
| --- | --- |
| `"observed"` | The newest value that could have reached the operator. `value` holds it |
| `"held"` | Updates stopped arriving, such as across a loss of signal. `value` holds the last one received |
| `"pending"` | Nothing has arrived yet |
| `"absent"` | The game confirmed there is no value, such as no target set |
| `"unowned"` | Nothing will ever publish this Topic: no installed Uplink declares it |

The widget `new` writes draws the values while the reading is observed or held, and says which of the other three it is otherwise, never a zero: a value you have not received is not a value of zero, and the two mean opposite things to an operator. The example adds the modelled count and the reset button to it.

Each payload field is also on the reading as a `Reading` of its own, `heartbeat.ticks` beside `heartbeat.value.ticks`. Hand that to `Unit`, never the bare value: the field reading carries its own state, so `Unit` draws a held value with the held mark, and the null token when there is no value. `ModelledAlongside` and the `reckoning` lines draw this Uplink's model beside the count received ([Writing a reckoner](/guide/reckoners)), and the reset button is [Sending a command](/guide/client-commands).

## A text field

`Unit` draws quantities only: a field the contract slice tags `Units.Text` arrives as a `Reading` of a string, which `Unit` does not take. Draw it with the same care by hand: the null token with no value, and the held mark on a value that stopped updating, which `derivedMarking` reads off the reading and `HeldFigure` draws.

<<< ../../reference/examples/guide/VesselName.tsx

## Drawing it

The widget is drawn entirely from `@ksp-gonogo/ui-kit`, the components the app's own widgets use, so it looks like them and reflows the way they do when the operator resizes its tile:

- **`Panel`** is the widget's frame: `panelTitle` its heading, `sections` its body, `panelAside` a control in its header
- [**`Section`**](/reference/ui-kit/Layout#Section) groups a body's content, and the panel lays sections out in columns when the tile is wide enough
- **`Unit`** draws a quantity with its symbol, choosing the unit from the value's size, so hand it values as they arrived
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
