// #region example
import { Value, formatNumber } from "@ksp-gonogo/ui-kit";

export function Altitude({ metres }: { metres: number | undefined }) {
  return (
    <>
      Altitude
      <Value spaced size="lg">
        {formatNumber(metres, { decimals: 1 })} m
      </Value>
    </>
  );
}
// #endregion example
