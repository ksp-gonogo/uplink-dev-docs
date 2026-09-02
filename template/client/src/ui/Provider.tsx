// #region provider
import { GonogoTokens, defaultDarkTheme } from "@ksp-gonogo/ui-kit";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";

/** Every kit primitive reads the theme, so wrap your widget tree once. */
export function KitProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={defaultDarkTheme}>
      <GonogoTokens />
      {children}
    </ThemeProvider>
  );
}
// #endregion provider
