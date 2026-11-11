import { useCommand } from "@ksp-gonogo/sitrep-sdk";
import { Button } from "@ksp-gonogo/ui-kit";

/** Staging cannot be recalled, so the first press arms the button and the second sends. */
export function StageButton() {
  const stage = useCommand("vessel.control.stage");
  return (
    <Button command={stage.with(undefined, { label: "Stage" })} confirmLabel="Confirm stage">
      Stage
    </Button>
  );
}
