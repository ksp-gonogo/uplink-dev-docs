import { useUtNow, value } from "@ksp-gonogo/sitrep-sdk";
import { Stat, Unit } from "@ksp-gonogo/ui-kit";

const BURN_UT = 1_000_754;

export function TimeToBurn() {
  const viewUt = useUtNow();
  return (
    <Stat label="Burn in">
      {viewUt === undefined ? "No stream" : <Unit value={value("s", BURN_UT - viewUt)} />}
    </Stat>
  );
}
