import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Text, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "transmitvalue",
  version: "1.0.0",
  name: "Transmit Value",
  description: "Adds a row to each experiment instrument showing the value to transmit.",
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
  id: "transmitvalue-row",
  augments: "experiments.instrument",
  component: TransmitValue,
  channels: ["science.experiments"],
  owner: uplink,
});
