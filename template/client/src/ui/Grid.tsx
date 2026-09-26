// #region example
import { Grid, Text } from "@ksp-gonogo/ui-kit";

export function CoverageRow({ body, percent }: { body: string; percent: string }) {
  return (
    <Grid cols="120px 1fr 60px" gap="related">
      <span>{body}</span>
      <span />
      <Text size="sm">{percent}</Text>
    </Grid>
  );
}
// #endregion example
