// #region example
import { ActionButton, Inline } from "@ksp-gonogo/ui-kit";

export function DeployControls({ onDeploy }: { onDeploy: () => void }) {
  return (
    <Inline gap="related-compact">
      <ActionButton onClick={onDeploy}>Deploy</ActionButton>
      <ActionButton tone="go" onClick={onDeploy}>
        Confirm
      </ActionButton>
    </Inline>
  );
}
// #endregion example
