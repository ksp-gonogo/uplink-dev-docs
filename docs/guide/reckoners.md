# Writing a reckoner

A reckoner is a forward model for one Topic: given the samples that have arrived, it says what the value is now. This page covers when an Uplink wants one, and builds one for the heartbeat in a new file, `client/src/reckoner.ts`.

## When you want one

Every sample a plugin publishes is true at the game time it was taken, and reaches the operator later: at the next sample, or after the signal delay for a craft far from home. Between samples the widget shows the last value received, which is older than it looks.

A reckoner fills that gap for a value that moves predictably, such as a clock, a count at a steady rate, or a craft coasting on an orbit. The widget then shows what the model says the value is now, marked as modelled, beside what was last received. [Reckoning](/reference/concepts/reckoning) defines the idea in full.

Do not write one for a value that changes on its own terms, such as a switch the player flips or a reading from another mod's simulation: a model that guesses is worse than an honest "as last received". When a model cannot be sure, it declines and says why, and the widget shows only what was received.

## The model

The first half of `client/src/reckoner.ts`:

<<< ../../example/client/src/reckoner.ts#reckon

`reckonTicks` is the model. It is a plain function of the latest sample (`point`), the window of samples before it (`history`) and the game time the model is asked to reach (`reckonUt`), so it can be tested without the app. It returns either a `TopicModel` or `{ declined }` with a `ReckoningDecline`:

- **`modelled`** lists the parts of the payload the model moves, each a path and a `ReckoningBasis` naming the kind of model (`"rate-integration"` here: a rate, carried forward). An Uplink's model moves the whole payload, path `""`: a model of some fields only is offered just for a core Topic whose contract declares those fields
- **`reckon(viewUt)`** returns the payload as the model says it is at `viewUt`. It must be pure, the same inputs always giving the same result, because the app runs it for every frame that reads the Topic
- **A decline** names its reason, one of those `ReckoningDecline` lists: `"insufficient-history"` for too few samples to take a rate from, `"model-inapplicable"` when the model does not fit this sample, as after a reset, and `"beyond-horizon"` when the sample is too old to carry this far

Keep `reckonTicks` cheap. The work belongs in the `reckon` it returns, which runs only when a widget reads the value.

## Registering it

The second half of the file:

<<< ../../example/client/src/reckoner.ts#register

`UplinkClientHandle.registerReckoner` takes the Topic and a `ReckonerDefinition`, whose own `reckon` the app calls with the sample, the resolved `deps` and a `ReckonerFrame`; here it passes the frame's `history` and `reckonUt` on to `reckonTicks`.

- **`deps`** lists other Topics the model reads, resolved before `reckon` runs. A model that needs one that has not arrived declines without being asked. The heartbeat's model reads only its own Topic, so it lists none
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

And test the widget with the model running, through a stream fixture: two samples ten seconds apart, the clock pinned five seconds after the second, and the widget drawing the count received beside the count the model carried there.

<<< ../../example/client/src/Heartbeat/index.test.tsx#reckoned

`setupStreamFixture` runs the app's own telemetry pipeline over a transport the test feeds by hand, so the reckoner is asked exactly as it is in the app. [Testing](/guide/testing) covers fixtures.

Next: [Extensions](/guide/extensions).
