import { enumNameOf, SITUATION_NAMES, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Stat } from "@ksp-gonogo/ui-kit";

export function SituationLine() {
  const identity = useTelemetry("vessel.identity");
  if (identity.state !== "observed") return null;
  const situation = enumNameOf(SITUATION_NAMES, identity.value.situation);
  return <Stat label="Situation">{situation ?? ""}</Stat>;
}
