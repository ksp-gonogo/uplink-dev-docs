# Panel

The widget frame. It takes its title and its body as props, and owns the padding and the scrolling itself.

```ts
interface PanelProps extends ComponentPropsWithoutRef<"div"> {
  panelTitle?: ReactNode;
  compactTitle?: string | readonly string[];
  panelAside?: ReactNode;
  sections?: Exclude<ReactNode, boolean> | readonly ReactNode[];
  sectionMinWidth?: string;
  floatingHeader?: boolean;
}

declare const Panel: ((props: PanelProps) => JSX.Element) & {
  Title: ForwardRefExoticComponent<PanelTitleProps>;
  Body: typeof PanelBody;
  Section: typeof Section;
};
declare const ScrollArea: ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
>;
```

`panelTitle` rather than `title` because the div's own `title` attribute is a tooltip string and the two cannot share a name. `Section` does the reverse and omits the attribute, which is why its heading prop is just `title`.

<<< ../../../template/client/src/ui/Panel.tsx#example

## Title and body are props, not children

`panelTitle` is what opts the panel into the composed frame: it draws its own title and pads its body, which is what every built-in widget looks like. Rendering `Panel.Title` as a child instead still works and is the retiring form, and it gets the older unpadded passthrough.

`sections` is the body. Each entry is normally a [Section](/reference/ui-kit/Section), which carries its own `title`, so you stop hand-rolling a heading above a `Stack` for every group. Passing one node rather than an array is not an abuse of it: a body that is a single list says `sections={<Section>…</Section>}`.

Handing the body over is what buys the reflow. `Panel` knows the tile's width and you do not, so it decides whether the sections run down one column in a portrait tile or across two or three in a landscape one. `sectionMinWidth` sets how narrow a column may get before it gives up on offering a second; set it to `100%` for a body that should never columnise.

The one exception is a widget that is WHOLLY a drawing: a map, a globe, an orbit view. Its content is the panel rather than a section of it, and `floatingHeader` bleeds the body out to the chrome. Those keep children.

## compactTitle

A widget declares a `minSize` and the dashboard enforces it, so the title has to keep that promise at that size. `compactTitle` takes shorter forms, longest first, and the panel shows the longest one that fits. The full title stays the accessible name and the hover tooltip, so a screen reader does not lose what a sighted operator gave up for room.

Do not machine-shorten a title instead. An ellipsis is exactly what this replaces.

## panelAside

The right of the header row: state chips, a small select, a show/hide button.

It COLLAPSES at narrow widths and takes its contents with it, so nothing an operator must see belongs there. A cost or a balance beside a control that spends it goes in the body.

## ScrollArea

`sections` already makes the panel body the scroller, so a widget using it rarely needs this. Reach for it for a region INSIDE a section that overflows on its own: a terminal buffer, a file tree, a long log.

It shows a subtle glow at the top or bottom edge when there is more content in that direction, which is the only cue an operator gets that a list continues. It forwards its ref to the inner scroll element, so you can scroll it imperatively. Standard div props land on the root; `styled(ScrollArea)` styles the root.

Do not put a raw `overflow: auto` on a div instead. The edge cue is the point.
