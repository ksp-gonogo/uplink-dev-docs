// #region example
import { ActionButton, PanelTitle, WidgetHeader } from "@ksp-gonogo/ui-kit";

export function Header({ onRefresh }: { onRefresh: () => void }) {
  return (
    <WidgetHeader
      title={<PanelTitle>Antennas</PanelTitle>}
      actions={<ActionButton onClick={onRefresh}>Refresh</ActionButton>}
    />
  );
}
// #endregion example
