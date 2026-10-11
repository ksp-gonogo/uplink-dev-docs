import { useViewUt, value } from "@ksp-gonogo/sitrep-sdk";
import { Stat, Unit } from "@ksp-gonogo/ui-kit";

// The burn's start as an absolute UT. A real widget reads it from a Topic such as `vessel.maneuver`.
const BURN_UT = value("ut", 1_000_754);

export function TimeToBurn() {
  const viewUt = useViewUt();
  if (viewUt === undefined) return <Stat label="Burn in">No stream</Stat>;
  const remaining = BURN_UT.minus(viewUt);
  return (
    <Stat label={remaining.isPositive() ? "Burn in" : "Burn began"}>
      <Unit value={remaining.abs()} />
    </Stat>
  );
}
