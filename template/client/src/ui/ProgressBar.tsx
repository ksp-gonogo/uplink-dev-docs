// #region example
import { ProgressBar, Stack, Value } from "@ksp-gonogo/ui-kit";

export function Coverage({ body, percent }: { body: string; percent: number }) {
  return (
    <Stack gap="xs">
      <Value size="sm">{percent.toFixed(1)}%</Value>
      <ProgressBar value={percent} ariaLabel={`Biome coverage, ${body}`} />
    </Stack>
  );
}
// #endregion example
