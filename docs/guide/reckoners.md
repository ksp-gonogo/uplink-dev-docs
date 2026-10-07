# Writing a reckoner

A reckoner is a forward model for one Topic: given the samples that have arrived, it says what the value is now. This page covers when an Uplink wants one, and builds one for the heartbeat.

## When you want one

Every sample a plugin publishes is true at the game time it was taken, and reaches the operator later: at the next sample under time warp, or after the signal delay for a craft far from home. Between samples the widget shows the last value received, which is older than it looks.

A reckoner fills that gap for a value that moves predictably, such as a clock, a count at a steady rate, or a craft coasting on an orbit. The widget then shows what the model says the value is now, marked as modelled, beside what was last observed. [Concepts](/guide/concepts) has the full picture of observed, held and modelled values.

Do not write one for a value that changes on its own terms, such as a switch the player flips or a reading from another mod's simulation: a model that guesses is worse than an honest "as last received". When a model cannot be sure, it declines and says why, and the widget shows the observed value.

## The model

<<< ../../example/client/src/reckoner.ts#reckon

`reckon` is given the latest sample (`point`), the window of samples before it, and the instant the model is asked to reach. It returns either a `TopicModel` or `{ declined }` with a `ReckoningDecline`:

- **`modelled`** lists the parts of the payload the model moves, each a path and a `ReckoningBasis` naming the kind of model. An Uplink's model moves the whole payload, path `""`: a model of only some fields is offered only for a core Topic whose contract declares those fields reckonable
- **`reckon(viewUt)`** returns the payload as the model says it is at `viewUt`. It must be pure, the same inputs always giving the same result, because the app runs it for every frame that reads the Topic
- **A decline** names its reason: `"insufficient-history"` for too few samples to take a rate from, `"model-inapplicable"` when the model does not apply to this sample, as after a reset, and `"beyond-horizon"` when the sample is too old to carry this far

Keep `reckon` cheap. The work belongs in the function it returns, which runs only when a widget reads the value.

## Registering it

<<< ../../example/client/src/reckoner.ts#register

Register through the client's handle, `UplinkClientHandle.registerReckoner`, with a `ReckonerDefinition`:

- **`deps`** lists other Topics the model reads, resolved before `reckon` runs. A model that needs one that has not arrived declines without being asked. The heartbeat's model reads only its own Topic, so it lists none
- **`window`** is a `ReckonerWindow`: how far back to keep samples of the Topic itself, how many at most, and the fewest the model can work with. With fewer than `minSamples`, the reading declines with `"insufficient-history"` and `reckon` is not called. Without a window the model gets the latest sample alone
- **`reckon`** receives the sample, the resolved `deps` in order, and a `ReckonerFrame` carrying the window as `history` and the instant to reach as `reckonUt`

Register a model only for a Topic your Uplink publishes. Two Uplinks modelling one Topic cancel each other out, and neither model is used.

## Reading it

A widget reads the model off the reading's `reckoning`:

<<< ../../example/client/src/Heartbeat/index.tsx#reckoning

`reckoning.status` is `"available"` with the modelled `value`, `"declined"` with the reason, or `"none"` when no model is registered. [A widget](/guide/client-widget#reading-a-topic) shows the whole component.

## Testing it

Because `reckon` is a plain function, test it directly, a case per answer:

<<< ../../example/client/src/reckoner.test.ts

And test the widget with the model running, through a stream fixture: two samples ten seconds apart, the clock pinned five seconds after the second, and the widget drawing the count the model carried there.

<<< ../../example/client/src/Heartbeat/index.test.tsx#reckoned

`setupStreamFixture` runs the app's own telemetry pipeline over a transport the test feeds by hand, so the reckoner is asked exactly as it is in the app. [Testing](/guide/testing) covers fixtures.

Next: [Extensions](/guide/extensions).
