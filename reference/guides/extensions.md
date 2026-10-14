# Extensions

A built-in widget can be extended without changing it. Each widget names the
places an Uplink may add to, called [slots](/reference/concepts/augment-contribution-and-slot), and each slot takes one of two
kinds of extension: an augment or a contribution. Every widget's reference
page lists its slots, for example [Crew Status](/reference/widgets/crew-status).
Every slot has an id. The second half of this page lists the ids of augment
slots as the entries of `SlotRegistry`, each with the props the widget passes
the augment, and the ids of contribution slots as the entries of
`ContributionRegistry`, each with the type of entry the widget draws. A
widget's own page says which kind each of its slots is.

A widget names its slots in its registration, in `augmentSlots` for augments
and `contributionSlots` for contributions. You do not write either: they are
how the widget declares which places exist.

An Uplink needs none of this to show its own widgets. Use it to put your
mod's information inside one of the app's widgets, such as a badge on a crew
row or a section in the Map View. The second half of the page is the
reference for every type it names; the Reference's Client SDK pages do not
repeat them.

## Augments

An augment is a React component. You register it against a slot id with
`registerAugment`, naming the slot in `augments`, and the widget renders your
component in that place, passing it the slot's props.

Use an augment when you are drawing something the widget has no way to draw
for you: an avatar, a section of your own, a control.

Put the component in a file of its own under `client/src/`, and import that
file from `client/src/index.ts`: a file nothing imports never registers
([A widget](/guide/client-widget#the-entry)). An augment's id is not prefixed
for you, so start it with your Uplink's id (`crewportraits-initials`), because
it must be unique across every Uplink.

This one draws each kerbal's initials in Crew Status's avatar cell. It names
the Uplink's one client handle, from `defineUplinkClient`, as `owner`, so in
your own Uplink pass the handle you already have rather than defining a second:

<!-- example: crew-status--avatar -->

### How an augment is rendered {#augment-rendering}

<!-- remarks: AugmentDefinition -->

<!-- symbol: registerAugment -->

<!-- symbol: AugmentDefinition -->

<!-- symbol: SlotProps -->

## Contributions

A contribution is data, not a component. You register it with your client
handle's `registerContribution`, naming the slot in `contributes`, the Topics
you read in `deps`, and a `compute` function that turns those Topics into
entries. The widget draws the entries itself, so they look like the widget's
own rows, badges or meters.

Use a contribution when the slot's entry type already says what you want to
show.

Put this in a file of its own under `client/src/` as well, imported from
`client/src/index.ts`. A contribution's id is prefixed with your Uplink's id
for you, so it needs only to be unique within your Uplink.

This one adds an experience meter under each kerbal in Crew Status. `deps`
lists the Topics `compute` receives, each as a reading. A reading is observed
when its value is the newest that could have reached the app, held when updates stopped but the last
value is known, absent when the game confirms there is none, pending when
nothing has arrived yet, and unowned when no installed Uplink declares the Topic.
`stillTrue` is for a fact that cannot change unseen: it returns the value of a
reading that is observed or held, returns its second argument when the reading
is absent, and returns `undefined` while the reading is pending or unowned. A
contribution's `priority` is its band: only the highest band in a slot draws,
all of it together, and the default band 1 would replace the widget's own
entries (they are in band 0), so the example uses 0 to draw beside them:

<!-- example: crew-status--meters -->

### How a contribution runs {#contribution-running}

<!-- remarks: ContributionDefinition -->

<!-- symbol: ContributionDefinition -->

<!-- symbol: DepTopics -->

<!-- symbol: ContributionEntry -->

## Search terms

A widget that draws a list with a search box, such as Experiments, Resource Ops, Science Data and Tech Tree, can offer one-press terms above it. A `filters` contribution returns the terms, plain strings, and the widget shows each as a toggle that narrows the list to rows containing it. The slot id is the widget's id and `filters`:

<<< ../../reference/examples/extensions/filter-terms.ts

A widget of your own can take its terms from a segment of its own instead of `filters`. Declare the segment by adding an entry whose entry type is `string` to `ComponentSlotRegistry`, as the second half of the example does, then pass its name as the `segment` of the `FilterList`, or of the options to `useRowFilter`. Contributions to `<widget id>.my-terms` then arrive as that list's toggles. Only a segment whose entries are strings can be used for terms, since a row is matched by text.

## Standard slots

Some slots are on every widget, whatever the widget. A standard slot's id is
the widget's id and the segment, such as `crew-status.badges`, and every
widget's reference page lists them beside its own.

Other slots belong to one widget, or to a component a widget chooses to show,
such as a meter list or a filter bar. Those appear on a widget's page only
when that widget has them.

<!-- rest -->

Next: [See your Uplink in the app](/guide/dev-loop).
