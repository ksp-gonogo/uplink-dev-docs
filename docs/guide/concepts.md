# Concepts

Some of the API is built on ideas no single type holds: what "current" means for a value that crossed a signal delay, where an operator is sitting, what a model may claim. This page introduces each one, in the order a new author meets them. The Reference's concept pages, written beside the code they explain, give each its full definition.

## Topics and samples

A **Topic** is a named stream of one payload shape. The plugin publishes **samples** onto it, each stamped with the game time (UT, universal time, in seconds) it was true at. A sample is published when the value changes enough, and at least once every keyframe interval (the channel's [`keyframeIntervalUt`](/guide/topics#declaring-the-topic)), so a quiet Topic still proves it is alive. [Publishing a Topic](/guide/topics) covers the plugin's side.

## Readings

A widget never reads a bare value. It reads a **reading**: the latest value together with how current it is, as one of five states (observed, held, pending, absent, unowned). The state is what lets a widget tell "nothing has arrived yet" from "the game says there is none" from "this stopped updating", three things a bare `null` or zero would make look the same. [A widget](/guide/client-widget#reading-a-topic) lists the states, and `TopicReading` defines them.

**Held** is the state of a value that stopped arriving on schedule: the link dropped, or the craft is out of contact. The last value is still shown, marked as held, because an operator needs it, and needs to know it is old. See [Held](/reference/concepts/held).

## Signal delay and command centres

Gonogo can model the time a radio signal takes to cross space. An operator works from a **command centre**, and a craft far from it is seen as it was when its signal left: its telemetry arrives after the delay, and a command sent to it arrives after the delay too. A mission can have several command centres at different distances from the same craft.

This is why each channel, in its declaration, and each command, in its arguments' attribute, declares a delay role: `Delayed` for anything about a craft, which waits for the signal, and `TrueNow` for anything about the ground or the connection, which does not. A command's `send` resolves only once the command has run, which can be minutes after it was sent, and `CommandDelay` shows the operator where it is. See [Delay and vantage](/reference/concepts/delay-and-vantage).

## Reckoning

Between samples, and across a signal delay, the last value received is older than the moment the operator is looking at. **Reckoning** is a forward model's answer to "what is it now": a value carried forward from the last observation by a model the reading names, such as a rate or an orbit. A reckoned value is always marked as modelled, never passed off as observed, and a model that cannot be sure declines and says why. See [Reckoning](/reference/concepts/reckoning), and [Writing a reckoner](/guide/reckoners) to build one.

## Values and units

A quantity in a payload is a `Value`: a number with its unit, such as `Value<"m/s">`. Values convert between units and compare with each other, so a widget compares a speed with `lessThan` rather than with a bare number, and `Unit` draws a value in the unit its size suits, such as kilometres for a long distance, unless you pin one with its `format` or `as` prop. [Units and values](/reference/client/units-and-values) defines them.

## Slots, augments and contributions

The app's own widgets name **slots**, places an Uplink may add to. An **augment** is a component drawn in a slot; a **contribution** is data a widget draws for you, such as a badge. See [Augment, contribution and slot](/reference/concepts/augment-contribution-and-slot), and [Extensions](/guide/extensions) for both in use.

## Actions and bindings

An **action** is something a widget can be told to do, such as step a value, which the operator can bind to a key, a joystick button or a physical device. A widget declares its actions when it registers and handles them in its body. See [Action and binding](/reference/concepts/action-and-binding).

## Domains and seats

Some widgets and extensions only make sense while a mod is present, such as one integrating a science mod. A **Domain** is that presence: an Uplink's extension names one in its [`requires`](/guide/extensions#AugmentDefinition.requires), and is mounted only while it is present, which starts with the first value its `<id>.available` Topic publishes, `true` or `false`. A **seat** is where the operator sits, at mission control or aboard the craft as its pilot, and a widget reading a Topic about the ground, such as the space centre or the career, stays at mission control, while every other widget, one reading an Uplink's own Topics included, is offered aboard as well. See [Domain and seat](/reference/concepts/domain-and-seat).

## The main screen and stations

The app runs on one **main screen**, connected to the game, and any number of **stations**: other screens, such as a tablet at a second desk, that receive the main screen's telemetry rather than connecting to the game themselves. A widget runs the same on either, so an Uplink's client needs nothing of its own for this. See [Station and main screen](/reference/concepts/station-and-main-screen).

## The binary lane

Most samples travel as JSON. A Topic that carries bytes, such as audio, travels on the **binary lane** instead, as raw bytes rather than JSON. An Uplink meets it only when it publishes bytes. See [Binary lane](/reference/concepts/binary-lane).

Next: [Known limits](/guide/limits).
