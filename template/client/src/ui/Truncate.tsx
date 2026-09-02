// #region example
import { Grid, Truncate, Value } from "@ksp-gonogo/ui-kit";

export function PartRow({ title, mass }: { title: string; mass: string }) {
  return (
    <Grid cols="1fr 60px" gap="sm">
      <Truncate>{title}</Truncate>
      <Value size="sm">{mass}</Value>
    </Grid>
  );
}
// #endregion example
