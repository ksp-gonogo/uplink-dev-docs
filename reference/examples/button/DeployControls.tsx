import { useState } from "react";
import { Button, ButtonGroup, Cluster, ToggleButton } from "@ksp-gonogo/ui-kit";

const RATES = [1, 5, 10, 50];

export function DeployControls() {
  const [rate, setRate] = useState(1);
  return (
    <Cluster gap="related" align="center">
      <ButtonGroup>
        <Button variant="ghost">Preview</Button>
        <Button variant="primary">Deploy</Button>
      </ButtonGroup>
      <Cluster gap="related-compact">
        {RATES.map((r) => (
          <ToggleButton key={r} size="sm" pressed={r === rate} onClick={() => setRate(r)}>
            {r}x
          </ToggleButton>
        ))}
      </Cluster>
    </Cluster>
  );
}
