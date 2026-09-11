# Theme

```ts
interface UiKitTheme {
  colors: ThemeColors;
  typography: ThemeTypography;
  space: ThemeSpace;
  radii: ThemeRadii;
  borders: ThemeBorders;
}
```

The kit augments styled-components' `DefaultTheme` with this interface, so `theme.colors.text.muted` is typed inside any `styled` template you write.

`defaultDarkTheme` is the built-in theme, and `DefaultThemeProvider` is styled-components' `ThemeProvider` with that theme already in it.

<<< ../../../template/client/src/ui/Provider.tsx#provider

## Tokens are named by role

```ts
interface ThemeColors {
  text: { primary; muted; dim; faint; inverse };
  surface: { app; panel; raised; sunken };
  border: { subtle; strong };
  accent: { fg; bg };
  status: {
    go: { fg; bg };
    nogo: { fg; bg };
    warning: { fg; bg };
    info: { fg; bg };
  };
  focus: string;
}
```

Reach for the role, not the value. `text.faint` fails large-text contrast on dark surfaces, so keep it off anything the operator has to read.

```ts
interface ThemeTypography {
  family: { mono: string };
  size: { xs; sm; base; lg };
  weight: { regular: number; bold: number };
  letterSpacing: { tight; label; wide; body };
}

interface ThemeSpace { xs; sm; md; lg; xl }
interface ThemeRadii { xs; sm; md; pill }
interface ThemeBorders { subtle; strong }
```

Sizes and spacing resolve to CSS custom-property strings such as `var(--font-size-base)`, not to fixed lengths. That is what lets the responsive overrides in the token sheet (coarse-pointer bumps, reduced motion) keep working when you read from the theme.

## The token sheet

The strings above refer to custom properties, and something has to define them. That is the stylesheet, imported once from your entry point:

```ts
import "@ksp-gonogo/ui-kit/tokens.css";
```

Without it every themed size resolves to nothing. It is not mounted for you, because injecting a stylesheet is a side effect and the kit stays side-effect-free so it tree-shakes.

The sheet is the only route to the tokens. A component that wrote the same properties out in JS shipped alongside it for a while, which meant a hand-typed second copy of every value that nothing compared against the first; it drifted 39 properties behind before it was withdrawn.

## A custom theme

Build a `UiKitTheme` of your own if you want, and pass it to styled-components' `ThemeProvider` in place of `DefaultThemeProvider`. You will be the only widget on the dashboard wearing it, so prefer `defaultDarkTheme`.
