import { useCommand } from "@ksp-gonogo/sitrep-sdk";
import { Button, Cluster, CommandDelay } from "@ksp-gonogo/ui-kit";

export function SasSwitch() {
  const setSas = useCommand("vessel.control.setSas");
  return (
    <Cluster gap="related" align="center">
      <Button command={setSas.with({ enabled: true }, { label: "SAS on" })}>SAS on</Button>
      <Button command={setSas.with({ enabled: false }, { label: "SAS off" })}>SAS off</Button>
      <CommandDelay handle={setSas} />
    </Cluster>
  );
}
