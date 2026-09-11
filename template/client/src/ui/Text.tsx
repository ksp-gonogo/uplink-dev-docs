// #region example
import { Text } from "@ksp-gonogo/ui-kit";

export function Mode({ mode, live }: { mode: string; live: boolean }) {
  return (
    <>
      Mode
      <Text spaced size="lg" tone={live ? "go" : "muted"}>
        {mode}
      </Text>
    </>
  );
}
// #endregion example
