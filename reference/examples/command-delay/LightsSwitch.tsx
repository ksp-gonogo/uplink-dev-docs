import { useState } from "react";
import { useCommand } from "@ksp-gonogo/sitrep-sdk";
import { Cluster, CommandDelay, Switch } from "@ksp-gonogo/ui-kit";

export function LightsSwitch() {
  const setLights = useCommand("vessel.control.setLights");
  const [on, setOn] = useState(false);
  return (
    <Cluster gap="related" align="center">
      <Switch
        label="Lights"
        checked={on}
        onChange={(next) => {
          setOn(next);
          void setLights.send({ enabled: next });
        }}
      />
      <CommandDelay handle={setLights} />
    </Cluster>
  );
}
