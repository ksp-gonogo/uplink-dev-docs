// #region example
import { Badge, Button, Cluster, Inline } from "@ksp-gonogo/ui-kit";

export function InstrumentActions({ armed }: { armed: boolean }) {
  return (
    <Cluster justify="end">
      <Inline gap="related-compact">
        <Badge tone={armed ? "caution" : "go"}>
          {armed ? "ARMED" : "SAFE"}
        </Badge>
      </Inline>
      <Inline gap="related-compact" inset>
        <Button size="sm">Transmit</Button>
      </Inline>
    </Cluster>
  );
}
// #endregion example
