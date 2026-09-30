// #region example
import { Panel, Section, Text } from "@ksp-gonogo/ui-kit";

export function LogPanel({ lines }: { lines: string[] }) {
  return (
    <Panel
      panelTitle="Flight log"
      panelAside={
        <Text size="xs" level="muted">
          {lines.length} entries
        </Text>
      }
      sections={
        <Section fill>
          {lines.map((line) => (
            <Text key={line} size="xs">
              {line}
            </Text>
          ))}
        </Section>
      }
    />
  );
}
// #endregion example
