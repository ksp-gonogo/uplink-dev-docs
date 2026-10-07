// #region widget
import { registerComponent, useCommand, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { CommandButton, EmptyState, ModelledAlongside, Panel, Section, Text, Unit } from "@ksp-gonogo/ui-kit";
import { EXAMPLE } from "../uplink.js";

/**
 * How many samples the Example Uplink has published, and the game time of the
 * latest, with a button that starts the count again. Until a sample arrives it
 * says why there is none, since a zero would read as a count.
 */
function HeartbeatWidget() {
  const heartbeat = useTelemetry("example.heartbeat");
  const reset = useCommand("example.reset");

  // #region states
  if (heartbeat.state !== "observed" && heartbeat.state !== "held") {
    const why = {
      pending: "Waiting for the example Uplink",
      absent: "The example Uplink reports no heartbeat",
      unowned: "The example Uplink is not installed",
    }[heartbeat.state];
    return <Panel panelTitle="Heartbeat" sections={<Section><EmptyState>{why}</EmptyState></Section>} />;
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
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  component: HeartbeatWidget,
  // The Topics it needs. When the Uplink serving one is unavailable, the dashboard says why in the widget's place.
  channels: ["example.heartbeat"],
  defaultConfig: {},
  actions: [],
  owner: EXAMPLE,
});
// #endregion register

export { HeartbeatWidget };
