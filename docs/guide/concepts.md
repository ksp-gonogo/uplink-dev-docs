# Concepts

Some of the API is built on ideas no single type holds: what "current" means for a value that crossed a signal delay, where an operator is sitting, what a model may claim. This page introduces each one, in the order a new author meets them, and links to where the Reference defines it.

## Topics and samples

A **Topic** is a named stream of one payload shape. The plugin publishes **samples** onto it, each stamped with the game time (UT, universal time, in seconds) it was true at. A sample is published when the value changes enough, and at least every keyframe interval, so a quiet Topic still proves it is alive. [Publishing a Topic](/guide/topics) covers the plugin's side.

## Readings

A widget never reads a bare value. It reads a **reading**: the latest value together with how current it is, as one of five states (observed, held, pending, absent, unowned). The state is what lets a widget tell "nothing has arrived yet" from "the game says there is none" from "this stopped updating", three things a bare `null` or zero would make look the same. [A widget](/guide/client-widget#reading-a-topic) lists the states, and `TopicReading` defines them.

**Held** is the state of a value that stopped arriving on schedule: the link dropped, or the craft is out of contact. The last value is still shown, marked as held, because an operator needs it, and needs to know it is old.

## Signal delay and command centres

Gonogo can model the time a radio signal takes to cross space. An operator works from a **command centre**, and a craft far from it is seen as it was when its signal left: its telemetry arrives after the delay, and a command sent to it arrives after the delay too. A mission can have several command centres at different distances from the same craft.

This is why each channel and each command declares a delay role: `Delayed` for anything about a craft, which waits for the signal, and `TrueNow` for anything about the ground or the connection, which does not. A command's `send` resolves only once the command has run, which can be minutes after it was sent, and `CommandDelay` shows the operator where it is. The Reference's [Delay and vantage](/reference/client/delay-and-vantage) page covers the client's side.

## Reckoning

Between samples, and across a signal delay, the last value received is older than the moment the operator is looking at. **Reckoning** is a forward model's answer to "what is it now": a value carried forward from the last observation by a model the reading names, such as a rate or an orbit. A reckoned value is always marked as modelled, never passed off as observed, and a model that cannot be sure declines and says why. [Writing a reckoner](/guide/reckoners) builds one, and [Reckoners](/reference/client/reckoners) defines the types.

## Values and units

A quantity in a payload is a `Value`: a number with its unit, such as `Value<"m/s">`. Values convert between units and compare with each other, so a widget compares a speed with `lessThan` rather than with a bare number, and `Unit` draws a value in the unit the operator chose for its kind of quantity. [Units and values](/reference/client/units-and-values) defines them.

## Slots, augments and contributions

The app's own widgets name **slots**, places an Uplink may add to. An **augment** is a component drawn in a slot; a **contribution** is data a widget draws for you, such as a badge. [Extensions](/guide/extensions) covers both.

## Domains

Some widgets and extensions only make sense while a mod is present, such as one integrating a science mod. A **Domain** is that presence: an Uplink's extension names one in `requires`, and is mounted only while it is present. The Reference's [Registering](/reference/client/registering) page covers `requires`.

## The main screen and stations

The app runs on one **main screen**, connected to the game, and any number of **stations**: other screens, such as a tablet at a second desk, that receive the main screen's telemetry rather than connecting to the game themselves. A widget runs the same on either, so an Uplink's client needs nothing of its own for this. [Host and runtime](/reference/client/host-and-runtime) covers the few APIs that tell the two apart.

Next: [Known limits](/guide/limits).
