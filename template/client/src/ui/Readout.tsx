// #region example
import { Badge, Readout, ReadoutCaption } from "@ksp-gonogo/ui-kit";

export function DeltaV({ value, tight }: { value: string; tight: boolean }) {
  return (
    <>
      <Readout size={tight ? "inline" : "hero"} tone="go">
        {value}
      </Readout>
      <ReadoutCaption>m/s remaining</ReadoutCaption>
      <Badge tone="go">NOMINAL</Badge>
    </>
  );
}
// #endregion example
