import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Grid, Stat, Unit } from "@ksp-gonogo/ui-kit";

export function Balances() {
  const career = useTelemetry("career.status");
  if (career.state !== "observed") return null;
  const balances = career.value.balances;
  if (!balances) return null;
  return (
    <Grid minColWidth="7rem" fit align="stretch" gap="related-compact">
      <Stat label="Funds">
        {balances.funds ? <Unit value={balances.funds} /> : "No reading"}
      </Stat>
      <Stat label="Reputation">
        {balances.reputation ? <Unit value={balances.reputation} /> : "No reading"}
      </Stat>
      <Stat label="Science">
        {balances.science ? <Unit value={balances.science} /> : "No reading"}
      </Stat>
    </Grid>
  );
}
