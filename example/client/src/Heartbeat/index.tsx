import { registerComponent, useCommand, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { CommandButton, EmptyState, Panel, Section, Text, Unit } from "@ksp-gonogo/ui-kit";
import { EXAMPLE } from "../uplink.js";

// #region widget
function HeartbeatWidget() {
  const heartbeat = useTelemetry("example.heartbeat");
  const reset = useCommand("example.reset");

  if (heartbeat.state !== "observed") {
    return (
      <Panel
        panelTitle="Heartbeat"
        sections={
          <Section>
            <EmptyState>Waiting for the example Uplink</EmptyState>
          </Section>
        }
      />
    );
  }

  // #region reckoning
  // Between samples, this Uplink's reckoner says what the heartbeat reads now, when it has a model.
  const { reckoning } = heartbeat;
  const shown = reckoning.status === "available" ? reckoning.value : heartbeat.value;
  // #endregion reckoning

  return (
    <Panel
      panelTitle="Heartbeat"
      panelAside={<CommandButton handle={reset} commandLabel="Reset the count" label="Reset" size="sm" />}
      sections={
        <Section>
          <Text>
            Ticks <Unit value={shown.ticks} />
          </Text>
          <Text>
            UT <Unit value={shown.ut} />
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
  description: "How many times the Example Uplink has published, and the universal time of the last sample.",
  tags: ["example"],
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  component: HeartbeatWidget,
  channels: ["example.heartbeat"],
  defaultConfig: {},
  actions: [],
  owner: EXAMPLE,
});
// #endregion register

export { HeartbeatWidget };
