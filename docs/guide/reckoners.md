# Writing a reckoner

A reckoner is a forward model for one Topic: given the samples that have arrived, it says what the value is now. This page covers when an Uplink wants one, and builds one for the heartbeat in a new file, `client/src/reckoner.ts`.

## When you want one

Every sample a plugin publishes is true at the game time it was taken, and reaches the operator later: at the next sample, or after the signal delay for a craft far from home. Between samples the widget shows the last value received, which is older than it looks.

A reckoner fills that gap for a value that moves predictably, such as a clock, a count at a steady rate, or a craft coasting on an orbit. The widget then shows what the model says the value is now, marked as modelled, beside what was last received. [Reckoning](/reference/concepts/reckoning) defines the idea in full.

Do not write one for a value that changes on its own terms, such as a switch the player flips or a reading from another mod's simulation: a model that guesses is worse than an honest "as last received". When a model cannot be sure, it declines and says why, and the widget shows only what was received.

## The model

The first half of `client/src/reckoner.ts`:

<<< ../../example/client/src/reckoner.ts#reckon

`reckonTicks` is the model. It is a plain function of the latest sample (`point`), the window of recent samples, oldest first and ending with that same sample (`history`) and the game time the model is asked to reach (`reckonUt`), so it can be tested without the app. It returns either a [`TopicModel`](/reference/client/reckoners#TopicModel) or `{ declined }` with a [`ReckoningDecline`](/reference/client/reckoners#ReckoningDecline). The helpers in it come from the SDK: `value(unit, number)` makes a quantity from a unit id such as `"ut"` (a game time) or `"count"`, the ids the contract slice names with `Units.UniversalTime` and `Units.Count` ([Units and values](/reference/client/units-and-values)), and `.magnitude` reads the number back out of one:

- **`modelled`** lists the parts of the payload the model moves, each a path into the payload and a [`ReckoningBasis`](/reference/client/reckoners#ReckoningBasis) naming the kind of model (`"rate-integration"` here: a rate, carried forward; the others are `"combination"`, `"kepler-propagation"`, `"linear-dead-reckoning"` and `"powered-integration"`). A path of `""` means the whole payload, which is what an Uplink's own model moves
- **`reckon(viewUt)`** returns the payload as the model says it is at `viewUt`. It must be pure, the same inputs always giving the same result, because the app runs it for every frame that reads the Topic
- **A decline** names its reason, one of those `ReckoningDecline` lists: `"insufficient-history"` for too few samples to take a rate from, `"model-inapplicable"` when the model does not fit this sample, as after a reset, and `"beyond-horizon"` when the sample is too old to carry this far. The others are set by the app: `"input-absent"`, `"under-physics"` and `"contested"`

Keep `reckonTicks` cheap. The work belongs in the `reckon` it returns, which runs only when a widget reads the value.

## Registering it

The second half of the file:

<<< ../../example/client/src/reckoner.ts#register

`UplinkClientHandle.registerReckoner` takes the Topic and a [`ReckonerDefinition`](/reference/client/reckoners#ReckonerDefinition), whose own `reckon` the app calls with the sample, the resolved `deps` and a `ReckonerFrame`, and which answers with a `ReckonerAnswer`; here it passes the frame's `history` and `reckonUt` on to `reckonTicks`.

- **`deps`** lists other Topics the model reads, resolved before `reckon` runs. When one has not arrived, the app does not call `reckon` and the reading declines with `"input-absent"`. The heartbeat's model reads only its own Topic, so it lists none
- **`window`** is a `ReckonerWindow`: how far back to keep samples of the Topic itself, in game seconds (`spanUt`), how many at most, and the fewest the model can work with. With fewer than `minSamples`, the reading declines with `"insufficient-history"` and `reckon` is not called. Without a window the model gets the latest sample alone

Then add `import "./reckoner.js";` to `src/index.ts`, so the registration runs when the client loads ([A widget](/guide/client-widget#the-entry)).

Register a model only for a Topic your Uplink publishes. When two Uplinks register one for the same Topic, neither is used, and the reading declines with `"contested"`.

## Reading it

In the widget:

<<< ../../example/client/src/Heartbeat/index.tsx#reckoning

`reckoning.status` is `"available"` with the modelled `value`, `"declined"` with the reason, or `"none"` when no model is registered. The widget hands the modelled count to `ModelledAlongside`, which draws it with the modelled mark beside the count received, and only where the two differ at the precision drawn. Never draw a modelled value in place of the received one, or through a plain `Unit`, which would pass it off as observed.

## Testing it

`reckonTicks` is a plain function, so test it directly, a case per answer, in `client/src/reckoner.test.ts`:

<<< ../../example/client/src/reckoner.test.ts

And test the widget with the model running, through a stream fixture: two samples ten seconds apart, the clock pinned five seconds after the second, and the widget drawing the count received beside the count the model carried there. From `client/src/Heartbeat/index.test.tsx`:

<<< ../../example/client/src/Heartbeat/index.test.tsx#reckoned

`setupStreamFixture` (from `@ksp-gonogo/sitrep-sdk/testing`, the SDK's test helpers, which are part of the package you already installed) runs the app's own telemetry pipeline over a transport the test feeds by hand, so the reckoner is asked exactly as it is in the app. [Testing](/guide/testing) covers fixtures.

Next: [Extensions](/guide/extensions).
