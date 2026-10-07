// #region widget
import { registerComponent, useCommand, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { CommandButton, EmptyState, ModelledAlongside, Panel, Section, Text, Unit } from "@ksp-gonogo/ui-kit";
import { EXAMPLE } from "../uplink.js";

/** Why there is no count to draw. Each is a different thing for an operator to do something about, so each has its own words. */
const NO_VALUE = {
  pending: "Waiting for the example Uplink",
  absent: "The example Uplink reports no heartbeat",
  unowned: "The example Uplink is not installed",
};

/**
 * How many samples the Example Uplink has published, and the game time of the
 * latest. With no sample it says why there is none, since a zero would read as
 * a count. When samples stop arriving it keeps the last count and marks it as
 * held, since a stale number that looks current is worse than no number.
 * Between samples it draws what its reckoner says the count is now, beside
 * the count received, and Reset starts the count again.
 */
function HeartbeatWidget() {
  const heartbeat = useTelemetry("example.heartbeat");
  const reset = useCommand("example.reset");

  // #region states
  if (heartbeat.state !== "observed" && heartbeat.state !== "held") {
    return (
      <Panel
        panelTitle="Heartbeat"
        sections={
          <Section>
            <EmptyState>{NO_VALUE[heartbeat.state]}</EmptyState>
          </Section>
        }
      />
    );
  }
  // #endregion states

  // #region reckoning
  // Between samples this Uplink's reckoner says what the count is now, drawn beside the last one received.
  const { reckoning } = heartbeat;
  const modelled = reckoning.status === "available" ? reckoning.value : undefined;
  // #endregion reckoning

  // #region button
  const resetButton = <CommandButton handle={reset} commandLabel="Reset the count" label="Reset" size="sm" />;
  // #endregion button

  // heartbeat.ticks and heartbeat.ut are readings of one field each, and <Unit> marks a held one. heartbeat.value.ticks is the bare number: the same figure with nothing to say it has gone stale.
  return (
    <Panel
      panelTitle="Heartbeat"
      panelAside={resetButton}
      sections={
        <Section>
          <Text>
            Ticks <Unit value={heartbeat.ticks} /> <ModelledAlongside observed={heartbeat.value.ticks} modelled={modelled?.ticks} />
          </Text>
          <Text>
            UT <Unit value={heartbeat.ut} />
          </Text>
        </Section>
      }
    />
  );
}
// #endregion widget

// #region register
registerComponent({
  id: "example-heartbeat",
  name: "Heartbeat",
  // Shown in the widget picker and on the generated page: what it shows and what an operator can do with it, in plain words.
  description:
    "How many samples the Example Uplink has published, and the game time of the latest one, carried forward between samples. Reset starts the count again.",
  tags: ["example"],
  // In grid units. The smallest size is the smallest at which the title and both lines can still be read, which `uplink-tools docs` checks in a real browser.
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 5, h: 4 },
  component: HeartbeatWidget,
  // The Topics it needs. When the Uplink serving one is unavailable, the dashboard says why in the widget's place.
  channels: ["example.heartbeat"],
  defaultConfig: {},
  actions: [],
  owner: EXAMPLE,
});
// #endregion register

export { HeartbeatWidget };
