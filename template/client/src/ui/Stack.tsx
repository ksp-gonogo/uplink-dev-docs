// #region example
import { Stack, Text } from "@ksp-gonogo/ui-kit";

export function Readings({ readings }: { readings: string[] }) {
  return (
    <Stack gap="section">
      {readings.map((reading) => (
        <Text key={reading}>{reading}</Text>
      ))}
    </Stack>
  );
}
// #endregion example
