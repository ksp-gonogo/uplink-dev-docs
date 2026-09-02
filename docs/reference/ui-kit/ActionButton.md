# ActionButton

A compact row-level button. Renders a real `<button>` and forwards every button attribute.

```ts
type ActionButtonTone = "ghost" | "go";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ActionButtonTone;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `tone` | `ghost` | `ghost` is the neutral button. `go` is a filled green confirm that pulses. |

<<< ../../../template/client/src/ui/ActionButton.tsx#example

Reserve `go` for the confirm step of an arm-then-confirm pair. It pulses to pull the eye, so a screen of them pulls it nowhere.

An icon-only button needs an `aria-label`.
