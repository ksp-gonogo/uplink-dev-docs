import { useCommand } from "@ksp-gonogo/sitrep-sdk";
import { Button, Cluster, CommandDelay } from "@ksp-gonogo/ui-kit";

export function SasSwitch() {
  const setSas = useCommand("vessel.control.setSas");
  return (
    <Cluster gap="related" align="center">
      <Button onClick={() => void setSas.send({ enabled: true })}>SAS on</Button>
      <Button onClick={() => void setSas.send({ enabled: false })}>SAS off</Button>
      <CommandDelay handle={setSas} />
    </Cluster>
  );
}
