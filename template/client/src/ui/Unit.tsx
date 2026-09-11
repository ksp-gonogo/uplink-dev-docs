// #region example
import { type TopicPayload, value } from "@ksp-gonogo/sitrep-sdk";
import { Text, Unit } from "@ksp-gonogo/ui-kit";

/** A field off a core Topic is already a quantity, so hand it straight over. */
export function Altitude({
  flight,
}: {
  flight: TopicPayload<"vessel.flight"> | undefined;
}) {
  return (
    <>
      Altitude
      <Text spaced size="lg">
        <Unit value={flight?.altitudeAsl} />
      </Text>
    </>
  );
}

/** A number off your own Topic is not. Pair it with its unit once, here. */
export function Depth({ metres }: { metres: number | undefined }) {
  return <Unit value={metres === undefined ? null : value("m", metres)} />;
}
// #endregion example
