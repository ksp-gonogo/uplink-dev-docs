import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { derivedMarking, HeldFigure, NullValue, Text } from "@ksp-gonogo/ui-kit";

/**
 * A text field drawn with the same honesty a quantity gets from Unit: the null
 * token with no value, and the held mark on a value that stopped updating.
 */
export function VesselName() {
  const name = useTelemetry("vessel.identity").name;
  if (name.state !== "observed" && name.state !== "held") return <NullValue />;
  const mark = derivedMarking(name);
  return mark ? (
    <HeldFigure kind={mark.kind} caption={mark.caption}>
      {name.value}
    </HeldFigure>
  ) : (
    <Text>{name.value}</Text>
  );
}
