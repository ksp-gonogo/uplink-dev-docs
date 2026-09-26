// #region example
import { value } from "@ksp-gonogo/sitrep-sdk";
import { ProgressBar, Stack, Text, Unit } from "@ksp-gonogo/ui-kit";

export function Coverage({ body, percent }: { body: string; percent: number }) {
  return (
    <Stack gap="related-compact">
      <Text size="sm">
        <Unit value={value("%", percent)} />
      </Text>
      <ProgressBar value={percent} ariaLabel={`Biome coverage, ${body}`} />
    </Stack>
  );
}
// #endregion example
