// #region example
import { Stack, Value } from "@ksp-gonogo/ui-kit";

export function Readings({ readings }: { readings: string[] }) {
  return (
    <Stack gap="md">
      {readings.map((reading) => (
        <Value key={reading}>{reading}</Value>
      ))}
    </Stack>
  );
}
// #endregion example
