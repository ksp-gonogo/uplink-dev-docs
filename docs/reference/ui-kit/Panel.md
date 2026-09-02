# Panel

The widget frame, plus its title parts and a scrolling region.

```ts
declare const Panel: StyledComponent<"div">;
declare const PanelTitle: StyledComponent<HTMLHeadingElement>;
declare const PanelSubtitle: StyledComponent<"div">;
declare const ScrollArea: ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
>;
```

<<< ../../../template/client/src/ui/Panel.tsx#example

## ScrollArea

Wrap any region of a widget that can overflow. It shows a subtle glow at the top or bottom edge when there is more content in that direction, which is the only cue an operator gets that a list continues.

It forwards its ref to the inner scroll element, so you can scroll it imperatively. Standard div props land on the root; `styled(ScrollArea)` styles the root.

Do not put a raw `overflow: auto` on a div instead. The edge cue is the point.

## Title or header

`PanelTitle` is the title on its own. [WidgetHeader](/reference/ui-kit/WidgetHeader) is a title with a right-aligned actions slot and a bottom border. Use the header when the widget has controls.
