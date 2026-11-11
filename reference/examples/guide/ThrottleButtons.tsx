import { useCommand } from "@ksp-gonogo/sitrep-sdk";
import { Button, Cluster } from "@ksp-gonogo/ui-kit";

/** Two buttons sharing one command handle, each sending its own arguments. */
export function ThrottleButtons() {
  const setThrottle = useCommand("vessel.control.setThrottle");
  return (
    <Cluster gap="related" justify="start">
      <Button command={setThrottle.with({ value: 0 }, { label: "Throttle" })}>Cut</Button>
      <Button command={setThrottle.with({ value: 1 }, { label: "Throttle" })}>Full</Button>
    </Cluster>
  );
}
