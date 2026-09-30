# Button

The kit's button. Renders a real `<button>` and forwards every button attribute.

```ts
type ButtonVariant = "default" | "primary" | "ghost" | "text";
type ButtonTone = Extract<Tone, "neutral" | "go" | "warn" | "nogo">;
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  pressed?: boolean;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `variant` | `default` | How much the button asks to be pressed. `primary` is the one commit action of a group, filled in its tone; `ghost` the quiet secondary beside it; `text` no chrome at all, for words that are themselves the control |
| `tone` | `go` on `primary`, `neutral` otherwise | What the action does. `nogo` is destructive, `warn` needs attention, `neutral` has no state |
| `size` | `md` | `sm` for dense rows. Both keep the kit's one control height |
| `pressed` | none | Makes the button a toggle: sets `aria-pressed` and, while true, fills it in its tone |

<<< ../../../template/client/src/ui/Button.tsx#example

Labels are sentence case. Uppercase is reserved for headings and state tokens, so case tells an instrument from a control.

A button that sends a command should be `CommandButton` rather than a `Button` with an `onClick`: it carries the arm-then-confirm step, the pending face and the refusal reason a delayed command needs.

An icon-only button needs an `aria-label`.
