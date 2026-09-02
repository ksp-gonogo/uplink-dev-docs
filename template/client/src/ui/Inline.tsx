// #region example
import { ActionButton, Badge, Cluster, Inline } from "@ksp-gonogo/ui-kit";

export function InstrumentActions({ armed }: { armed: boolean }) {
  return (
    <Cluster justify="end">
      <Inline gap="xs">
        <Badge tone={armed ? "warn" : "neutral"}>{armed ? "ARMED" : "SAFE"}</Badge>
      </Inline>
      <Inline gap="xs" inset>
        <ActionButton>Transmit</ActionButton>
      </Inline>
    </Cluster>
  );
}
// #endregion example
