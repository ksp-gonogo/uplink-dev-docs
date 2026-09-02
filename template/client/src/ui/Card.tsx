// #region example
import { Card, Stack, Value } from "@ksp-gonogo/ui-kit";

export function VesselCard({ name, mass }: { name: string; mass: string }) {
  return (
    <Card>
      <Stack gap="xs">
        <span>{name}</span>
        <Value size="sm">{mass}</Value>
      </Stack>
    </Card>
  );
}
// #endregion example
