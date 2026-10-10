# Extensions

A built-in widget can be extended without changing it. Each widget names the
places an Uplink may add to, called [slots](/reference/concepts/augment-contribution-and-slot), and each slot takes one of two
kinds of extension: an augment or a contribution. Every widget's reference
page lists its slots, for example [Crew Status](/reference/widgets/crew-status).
An augment slot is looked up in `SlotRegistry` below and a contribution slot in
`ContributionRegistry`; the widget's page says which kind each of its slots is.

An Uplink needs none of this to show its own widgets. Use it to put your
mod's information inside one of the app's widgets, such as a badge on a crew
row or a section in the Map View. The second half of the page is the
reference for every type it names.

## Augments

An augment is a React component. You register it against a slot id with
`registerAugment`, naming the slot in `augments`, and the widget renders your
component in that place, passing it the slot's props.

Use an augment when you are drawing something the widget has no way to draw
for you: an avatar, a section of your own, a control.

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

This one adds an experience meter under each kerbal in Crew Status. `deps`
lists the Topics `compute` receives, each as a reading. `stillTrue` takes the
value of a reading that is observed or held, a fact that could not have changed
unseen, and gives its second argument when the reading is confirmed absent. A
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
