import {
  CELESTIAL_FACTS,
  defineProcessorContract,
  defineUplinkClient,
  useProcessor,
  useStream,
  type Value,
} from "@ksp-gonogo/sitrep-sdk";
import { Stat, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "descent",
  version: "1.0.0",
  name: "Descent",
  description: "Derives the rate a craft is descending at from its vertical speed.",
});

// #region carried
const FALL_RATE = uplink.registerProcessor({
  id: "fall-rate",
  deps: [{ reading: "vessel.flight" }],
  compute: ([flight]) => {
    if (flight.state !== "observed" && flight.state !== "held") return null;
    return flight.value.verticalSpeed.isNegative() ? flight.value.verticalSpeed.abs() : null;
  },
});
// #endregion carried

// #region read-carried
export function FallRate() {
  const rate = useProcessor(FALL_RATE);
  if (rate === undefined || rate.state === "pending" || rate.state === "unowned") {
    return <Stat label="Fall rate">Waiting for flight data</Stat>;
  }
  if (rate.state === "absent" || rate.value === null) {
    return <Stat label="Fall rate">Not falling</Stat>;
  }
  return (
    <Stat label="Fall rate">
      <Unit value={rate.value} />
    </Stat>
  );
}
// #endregion read-carried

// #region published
export const DESCENT_STATE = uplink.registerProcessor({
  id: "state",
  topic: "descent.state",
  fields: true,
  deps: ["vessel.flight"],
  compute: ([flight]) => {
    if (flight === undefined) return undefined;
    if (flight === null) return null;
    return { descending: flight.verticalSpeed.isNegative() };
  },
});

export function DescentState() {
  const state = useStream<{ descending: boolean }>("descent.state");
  if (state.state !== "observed" && state.state !== "held") return <Stat label="Descending">Waiting for flight data</Stat>;
  return <Stat label="Descending">{state.value.descending ? "Yes" : "No"}</Stat>;
}
// #endregion published

// #region celestial
export function MunIndex() {
  const facts = useProcessor(CELESTIAL_FACTS);
  // The catalogue is a fact, so a held one is still the catalogue.
  const catalogue = facts?.state === "observed" || facts?.state === "held" ? facts.value : undefined;
  if (catalogue === undefined) return <Stat label="Mun">Waiting for the body list</Stat>;
  const index = catalogue.indexByName.Mun;
  return <Stat label="Mun">{index === undefined ? "Not in this system" : `Body ${index}`}</Stat>;
}
// #endregion celestial

// #region contract
// In a module both Uplinks import: the result's type and the contract.
export const FALL_RATE_CONTRACT = defineProcessorContract<Value<"m/s"> | null>("descent:fall-rate");
// #endregion contract

// #region read-contract
// In any Uplink's component, with no dependency on the "descent" Uplink.
export function useFallRate() {
  return useProcessor(FALL_RATE_CONTRACT);
}
// #endregion read-contract
