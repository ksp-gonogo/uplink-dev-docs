# Writing a processor

A processor is a value worked out once from other Topics and shared. It names the Topics it reads, its `compute` function turns them into one result each frame, and any widget or contribution can read that result as if it were a Topic. This page covers when to write one, how the freshness of its inputs carries into its result, and how an Uplink reads a processor that another Uplink implements.

## When you want one

Write a processor when a figure is derived from more than one source and more than one piece of your client shows it: a vessel's descent rate beside its altitude, a body looked up by name. The app runs the processor once per frame however many widgets read it, so the work is done once and every reader draws the same figure.

Do not write one for a figure a single widget draws. Compute it in the widget: a processor adds an id, a dependency list and a handle to carry around, and buys nothing with one reader.

On its own a processor has no wire form and no history, and a widget reads it with `useProcessor` rather than `useTelemetry`. When the value needs a history, or a reader that takes a Topic id, [publish it as a Topic](#publishing-it-as-a-topic).

## Registering one

Register it on the client handle you already have. The `id` is prefixed with your Uplink's id, so this one is `descent:rate`. A Topic id in `deps` gives `compute` that Topic's payload, or `undefined` before the first sample, and `compute` returns the value every reader will see:

<<< ../../reference/examples/processors/DescentRate.tsx

`compute` takes the resolved dependencies in the order `deps` lists them, then the frame. Use `frame.viewUt`, the game time the screen is showing, rather than the wall clock, so a replay of the same samples gives the same result. A processor's `compute` must give the same result for the same inputs.

## How currency carries through

A bare Topic id in `deps` gives `compute` the payload and nothing about how current it is. To see that, name the Topic as `{ reading: "vessel.flight" }`: `compute` then receives a reading, whose `state` says whether the value is observed, held, absent, pending or unowned (see [Extensions](/guide/extensions#contributions) for what each means).

A processor with any reading among its dependencies hands its readers a reading too. `compute` still returns a plain result: the app dates that result by the inputs and adds the `state`, so a reader sees `held` when the flight data it came from is held. A processor that lists only Topic ids gives its readers the bare result, or `undefined` before the first frame.

<<< ../../reference/examples/guide/processors.tsx#carried

The reader checks the state before it draws, the same as for a Topic:

<<< ../../reference/examples/guide/processors.tsx#read-carried

A processor can also depend on another processor, by listing its handle in `deps`. Currency carries through that link in the same way.

## Publishing it as a Topic

Give a processor a `topic` and it is also a Topic the app computes. Anything that takes a Topic id reads it the way it reads a Topic the mod sends: `useStream`, a plot of its history, an alarm. The handle still works, and a `useProcessor` read and a Topic read of one processor in one frame are one evaluation. With `fields: true`, each field of the result is a Topic of its own, so this one is also `descent.state.descending`:

<<< ../../reference/examples/guide/processors.tsx#published

A published processor follows the rules of a Topic:

- `compute` returns `undefined` while an input has not arrived and `null` when the value is confirmed absent, so a reader can tell "waiting" from "there is none". A Topic id in `deps` gives `compute` `undefined` before the first sample and `null` once the game confirms there is none
- It reads every input at one instant, in the delay lane of the least current one, so a value is never put together from two instants a signal delay apart
- Its status is the worst of its inputs' statuses, and its age is that of the oldest input
- Its history is built by running `compute` again at each instant an input changed, so a chart can plot it and a replay shows it. The same inputs must give the same result. No status is recorded for a past instant, so a `{ reading }` dep is handed to a past instant as observed

Your Uplink cannot publish over a Topic Gonogo already publishes. When two Uplinks publish the same Topic, neither is used and reads of it stay `pending`.

## A processor the SDK ships

The SDK registers processors of its own, and `CELESTIAL_FACTS` is the one to look at. It reads `trackingStation.bodies` as a reading, and returns a `CelestialFacts`: the list of bodies, and each body's name by index and index by name. It lists the Topic as a reading because a body list is a fact, so a held one is still the list. Its widgets, the system view and the transfer window planner among them, read it instead of each searching the list.

Read it with `useProcessor`, and do not register a processor under its id:

<<< ../../reference/examples/guide/processors.tsx#celestial

## Reading another Uplink's processor

Your client can read a processor that another Uplink implements without installing it. Declare a contract for the processor's id and result type with `defineProcessorContract`, in a module both Uplinks import. A small shared package of your own does for two of your Uplinks. The id must be `<uplink id>:<name>`, the implementing Uplink's id then the processor's own name, or it throws.

<<< ../../reference/examples/guide/processors.tsx#contract

The reading Uplink then calls `useProcessor` with the contract, and the implementing Uplink registers a processor under the same id with a `compute` typed to the same result:

<<< ../../reference/examples/guide/processors.tsx#read-contract

When nothing registers the processor, as when the implementing Uplink's mod is not installed, `useProcessor` returns `undefined`, so a widget draws its own "not available" state. A contract does not say whether the processor's inputs were readings, so the result is typed as the bare value or a reading of it.

Next: [See your Uplink in the app](/guide/dev-loop).
