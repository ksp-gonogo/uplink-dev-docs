import { type SetThrottleArgs, useCommand } from "@ksp-gonogo/sitrep-sdk";
import { Button, Cluster, CommandDelay } from "@ksp-gonogo/ui-kit";

const PRESETS: SetThrottleArgs[] = [{ value: 0 }, { value: 0.5 }, { value: 1 }];

export function Throttle() {
  const setThrottle = useCommand("vessel.control.setThrottle");
  return (
    <Cluster gap="related" align="center">
      {PRESETS.map((args) => (
        <Button key={args.value} command={setThrottle.with(args, { label: "Throttle" })}>
          {Math.round(args.value * 100)}%
        </Button>
      ))}
      <CommandDelay handle={setThrottle} />
    </Cluster>
  );
}
