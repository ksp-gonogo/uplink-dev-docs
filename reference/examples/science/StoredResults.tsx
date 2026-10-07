import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Stack, Stat, Unit } from "@ksp-gonogo/ui-kit";

export function StoredResults() {
  const results = useTelemetry("science.experiments");
  if (results.state !== "observed" || !results.value) return null;
  return (
    <Stack gap="related-compact">
      {results.value.map((result) => (
        <Stat key={result.subjectId} label={result.title ?? "Untitled result"}>
          {result.dataAmount ? <Unit value={result.dataAmount} /> : "Size unknown"}
        </Stat>
      ))}
    </Stack>
  );
}
