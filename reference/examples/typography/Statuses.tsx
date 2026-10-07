import { Stack, Text } from "@ksp-gonogo/ui-kit";

export function Statuses() {
  return (
    <Stack gap="caption">
      <Text size="lg" weight="semibold">
        Stage 2 separation
      </Text>
      <Text tone="go">Engine nominal</Text>
      <Text tone="warn">Fuel low</Text>
      <Text tone="nogo">Signal lost</Text>
      <Text level="muted">Last contact 14:02</Text>
      <Text level="faint">Orbit unchanged</Text>
    </Stack>
  );
}
