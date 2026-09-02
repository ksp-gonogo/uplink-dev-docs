// #region example
import { ActionButton, Inline } from "@ksp-gonogo/ui-kit";

export function DeployControls({ onDeploy }: { onDeploy: () => void }) {
  return (
    <Inline gap="xs">
      <ActionButton onClick={onDeploy}>Deploy</ActionButton>
      <ActionButton tone="go" onClick={onDeploy}>
        Confirm
      </ActionButton>
    </Inline>
  );
}
// #endregion example
