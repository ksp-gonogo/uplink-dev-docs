import { value } from "@ksp-gonogo/sitrep-sdk";
import { Stack, Text, MissionDate } from "@ksp-gonogo/ui-kit";

const burn = value("ut", 9_201_600 + 3 * 3600);

export function EventTime() {
  return (
    <Stack gap="related-compact">
      <Text>
        Burn at <MissionDate value={burn} context={{ frame: "scet" }} />
      </Text>
      <Text>
        Seen at <MissionDate value={burn} context={{ frame: "received", vantage: "KSC" }} />
      </Text>
    </Stack>
  );
}
