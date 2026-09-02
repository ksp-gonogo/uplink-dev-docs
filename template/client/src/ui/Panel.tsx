// #region example
import { Panel, PanelSubtitle, PanelTitle, ScrollArea } from "@ksp-gonogo/ui-kit";

export function LogPanel({ lines }: { lines: string[] }) {
  return (
    <Panel>
      <PanelTitle>Flight log</PanelTitle>
      <PanelSubtitle>{lines.length} entries</PanelSubtitle>
      <ScrollArea>
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </ScrollArea>
    </Panel>
  );
}
// #endregion example
