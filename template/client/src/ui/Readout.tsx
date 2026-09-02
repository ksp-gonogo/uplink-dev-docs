// #region example
import {
  BigReadout,
  Readout,
  ReadoutCaption,
  StatusPill,
} from "@ksp-gonogo/ui-kit";

export function DeltaV({ value, tight }: { value: string; tight: boolean }) {
  const Hero = tight ? Readout : BigReadout;
  return (
    <>
      <Hero $tone="go">{value}</Hero>
      <ReadoutCaption>m/s remaining</ReadoutCaption>
      <StatusPill $tone="go">NOMINAL</StatusPill>
    </>
  );
}
// #endregion example
