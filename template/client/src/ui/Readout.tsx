// #region example
import {
  Badge,
  BigReadout,
  Readout,
  ReadoutCaption,
} from "@ksp-gonogo/ui-kit";

export function DeltaV({ value, tight }: { value: string; tight: boolean }) {
  const Hero = tight ? Readout : BigReadout;
  return (
    <>
      <Hero $tone="go">{value}</Hero>
      <ReadoutCaption>m/s remaining</ReadoutCaption>
      <Badge tone="go">NOMINAL</Badge>
    </>
  );
}
// #endregion example
