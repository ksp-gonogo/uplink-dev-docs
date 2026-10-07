import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Text, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "transmit-value",
  version: "1.0.0",
  name: "Transmit Value",
});

function TransmitValue({
  instrument,
}: SlotProps<"experiments.instrument">) {
  const experiments = useTelemetry("science.experiments");
  if (experiments.state !== "observed") return null;
  const stored = experiments.value.find(
    (result) => result.experimentId === instrument.expId,
  );
  if (!stored?.baseTransmitValue) return null;
  return (
    <li>
      <Text size="sm" level="muted">
        Transmits for <Unit value={stored.baseTransmitValue} />
      </Text>
    </li>
  );
}

registerAugment({
  id: "transmit-value-row",
  augments: "experiments.instrument",
  component: TransmitValue,
  channels: ["science.experiments"],
  owner: uplink,
});
