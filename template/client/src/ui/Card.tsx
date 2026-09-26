// #region example
import { Card, Stack, Text } from "@ksp-gonogo/ui-kit";

export function VesselCard({ name, mass }: { name: string; mass: string }) {
  return (
    <Card>
      <Stack gap="related-compact">
        <span>{name}</span>
        <Text size="sm">{mass}</Text>
      </Stack>
    </Card>
  );
}
// #endregion example
