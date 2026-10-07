import {
  bodyAtIndex,
  CELESTIAL_FACTS,
  useProcessor,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Stack, Stat, Text, Unit } from "@ksp-gonogo/ui-kit";

export function HomeBody() {
  const identity = useTelemetry("vessel.identity");
  const facts = useProcessor(CELESTIAL_FACTS);
  if (identity.state !== "observed" || facts?.state !== "observed") return null;
  const body = bodyAtIndex(facts.value, identity.value.parentBodyIndex);
  if (!body) return <Text>Body not known yet</Text>;
  return (
    <Stack gap="related-compact">
      <Text weight="semibold">{body.name}</Text>
      <Stat label="Radius">
        <Unit value={body.figures.radius} />
      </Stat>
      <Stat label="Surface gravity">
        <Unit value={body.figures.surfaceGravity} />
      </Stat>
    </Stack>
  );
}
