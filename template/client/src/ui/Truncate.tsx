// #region example
import { Grid, Text, Truncate } from "@ksp-gonogo/ui-kit";

export function PartRow({ title, mass }: { title: string; mass: string }) {
  return (
    <Grid cols="1fr 60px" gap="sm">
      <Truncate>{title}</Truncate>
      <Text size="sm">{mass}</Text>
    </Grid>
  );
}
// #endregion example
