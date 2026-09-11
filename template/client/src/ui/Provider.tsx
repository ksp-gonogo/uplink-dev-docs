// #region provider
import { DefaultThemeProvider } from "@ksp-gonogo/ui-kit";
import type { ReactNode } from "react";

/** Every kit primitive reads the theme, so wrap your widget tree once. */
export function KitProvider({ children }: { children: ReactNode }) {
  return <DefaultThemeProvider>{children}</DefaultThemeProvider>;
}
// #endregion provider
