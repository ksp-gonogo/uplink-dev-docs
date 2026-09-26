// #region widget
import {
  ActionButton,
  Badge,
  Cluster,
  EmptyState,
  Panel,
  Row,
  Section,
  Text,
} from "@ksp-gonogo/ui-kit";
import type { SitrepStream } from "./stream";
import { EXAMPLE_SET_MODE_COMMAND, type SetModeArgs } from "./topics";
import { useExampleStatus } from "./useExampleStatus";

const MODE_NAMES = ["Idle", "Standby", "Active"];

export function ExampleWidget({ stream }: { stream: SitrepStream }) {
  const status = useExampleStatus(stream);

  const setMode = (mode: number) =>
    void stream.command<SetModeArgs>(EXAMPLE_SET_MODE_COMMAND, { mode });

  return (
    <Panel
      panelTitle="Example"
      sections={
        status === undefined ? (
          <Section>
            <EmptyState layout="fill">Waiting for telemetry</EmptyState>
          </Section>
        ) : (
          <Section>
            <Row as="div">
              <Row.Name>Mode</Row.Name>
              <Text>{MODE_NAMES[status.mode] ?? "Unknown"}</Text>
            </Row>
            <Row as="div">
              <Row.Name>Power</Row.Name>
              <Badge severity={status.enabled ? "nominal" : "info"}>
                {status.enabled ? "ON" : "OFF"}
              </Badge>
            </Row>
            <Cluster justify="end" gap="related-compact">
              {MODE_NAMES.map((name, mode) => (
                <ActionButton
                  key={name}
                  tone={mode === status.mode ? "go" : "ghost"}
                  onClick={() => setMode(mode)}
                >
                  {name}
                </ActionButton>
              ))}
            </Cluster>
          </Section>
        )
      }
    />
  );
}
// #endregion widget
