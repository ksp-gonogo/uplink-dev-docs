// #region example
import { ActionButton, Badge, Cluster, Inline } from "@ksp-gonogo/ui-kit";

export function InstrumentActions({ armed }: { armed: boolean }) {
  return (
    <Cluster justify="end">
      <Inline gap="xs">
        <Badge severity={armed ? "caution" : "nominal"}>
          {armed ? "ARMED" : "SAFE"}
        </Badge>
      </Inline>
      <Inline gap="xs" inset>
        <ActionButton>Transmit</ActionButton>
      </Inline>
    </Cluster>
  );
}
// #endregion example
