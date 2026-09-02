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

`defaultDarkTheme` is the built-in theme. Pass it to `ThemeProvider`.

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

## GonogoTokens

```ts
declare const GonogoTokens: NamedExoticComponent;
```

A styled-components global sheet carrying the custom properties the theme's strings refer to. Render it once near the root. Without it, or without `@ksp-gonogo/ui-kit/tokens.css`, every themed size resolves to nothing.

It is not mounted for you: injecting a stylesheet is a side effect, and the kit stays side-effect-free so it tree-shakes.

## A custom theme

Build a `UiKitTheme` of your own if you want, but you will be the only widget on the dashboard wearing it. Prefer `defaultDarkTheme`.
