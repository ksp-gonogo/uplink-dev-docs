// npm install @ksp-gonogo/sitrep-sdk @ksp-gonogo/ui-kit
import { type ModSettingRow, useModSettings } from "@ksp-gonogo/sitrep-sdk";
import { Badge, Stack, Text } from "@ksp-gonogo/ui-kit";

function describe(row: ModSettingRow): string {
  if (row.unavailable) return `${row.label}: unavailable, ${row.unavailable}`;
  return `${row.label}: ${row.value ?? "not set"}`;
}

export function ModSettingList() {
  // The id of the Uplink whose host mod's settings are listed; "example" stands for your own Uplink's id.
  const model = useModSettings("example");
  if (model.state !== "observed" && model.state !== "held") return <Badge tone="offline">Waiting for the mod</Badge>;
  if (model.value.failure) return <Text>{model.value.failure}</Text>;
  return (
    <Stack gap="related-compact">
      {model.value.settings.map((row) => (
        <Text key={row.id}>{describe(row)}</Text>
      ))}
    </Stack>
  );
}
