import { useCommand } from "@ksp-gonogo/sitrep-sdk";
import { CommandButton } from "@ksp-gonogo/ui-kit";

/** Staging cannot be recalled, so the first press arms the button and the second sends. */
export function StageButton() {
  const stage = useCommand("vessel.control.stage");
  return <CommandButton handle={stage} commandLabel="Stage" label="Stage" confirmLabel="Confirm stage" />;
}
