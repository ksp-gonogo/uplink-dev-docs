import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Text, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "science-worth",
  version: "1.0.0",
  name: "Science Worth",
  description: "Adds the science worth of each file to the Science Data aboard rows.",
});

function Worth({ subjectId }: SlotProps<"science-data.aboard-row">) {
  const experiments = useTelemetry("science.experiments");
  if (experiments.state !== "observed") return null;
  const stored = experiments.value.find((result) => result.subjectId === subjectId);
  if (!stored?.scienceValueRatio) return null;
  return (
    <Text size="sm" level="muted">
      Worth <Unit value={stored.scienceValueRatio} /> of the subject's full value
    </Text>
  );
}

registerAugment({
  id: "science-worth-row",
  augments: "science-data.aboard-row",
  component: Worth,
  channels: ["science.experiments"],
  owner: uplink,
});
