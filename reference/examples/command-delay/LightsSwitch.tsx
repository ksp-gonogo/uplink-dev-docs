import { useCommand, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Cluster, CommandDelay, Switch } from "@ksp-gonogo/ui-kit";

export function LightsSwitch() {
  const setLights = useCommand("vessel.control.setLights");
  const control = useTelemetry("vessel.control");
  return (
    <Cluster gap="related" align="center">
      <Switch
        label="Lights"
        state={control.state === "observed" ? control.value.lights : undefined}
        command={setLights.toArgs((on: boolean) => ({ enabled: on }), { label: "Lights" })}
      />
      <CommandDelay handle={setLights} />
    </Cluster>
  );
}
