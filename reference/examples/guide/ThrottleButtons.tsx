import { useCommand } from "@ksp-gonogo/sitrep-sdk";
import { Cluster, CommandButton } from "@ksp-gonogo/ui-kit";

/** Two buttons sharing one command handle, each sending its own arguments. */
export function ThrottleButtons() {
  const setThrottle = useCommand("vessel.control.setThrottle");
  return (
    <Cluster gap="related">
      <CommandButton handle={setThrottle} commandLabel="Throttle" label="Cut" args={{ value: 0 }} />
      <CommandButton handle={setThrottle} commandLabel="Throttle" label="Full" args={{ value: 1 }} />
    </Cluster>
  );
}
