// #region example
import { Button, Inline } from "@ksp-gonogo/ui-kit";

export function DeployControls({ onDeploy }: { onDeploy: () => void }) {
  return (
    <Inline gap="related-compact">
      <Button variant="ghost" onClick={onDeploy}>
        Preview
      </Button>
      <Button variant="primary" onClick={onDeploy}>
        Deploy
      </Button>
    </Inline>
  );
}
// #endregion example
