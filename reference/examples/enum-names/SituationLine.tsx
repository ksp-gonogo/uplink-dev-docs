// npm install @ksp-gonogo/sitrep-sdk @ksp-gonogo/ui-kit
import { enumNameOf, SITUATION_NAMES, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Stat } from "@ksp-gonogo/ui-kit";

export function SituationLine() {
  const identity = useTelemetry("vessel.identity");
  if (identity.state !== "observed") return null;
  const situation = enumNameOf(SITUATION_NAMES, identity.value.situation);
  // enumNameOf returns undefined for a situation this version of the SDK has no name for, so the value is left empty.
  return <Stat label="Situation">{situation ?? ""}</Stat>;
}
