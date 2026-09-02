// #region example
import { Grid, Value } from "@ksp-gonogo/ui-kit";

export function CoverageRow({ body, percent }: { body: string; percent: string }) {
  return (
    <Grid cols="120px 1fr 60px" gap="sm">
      <span>{body}</span>
      <span />
      <Value size="sm">{percent}</Value>
    </Grid>
  );
}
// #endregion example
