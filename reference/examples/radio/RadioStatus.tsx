import { radioSupportStatus } from "@ksp-gonogo/sitrep-sdk/media";
import { Badge, Stat } from "@ksp-gonogo/ui-kit";

export function RadioStatus() {
  const support = radioSupportStatus();
  return (
    <Stat label="Radio">
      {support.supported ? (
        <Badge tone="go">Available</Badge>
      ) : (
        <Badge tone="warn">
          {support.reason === "insecure-context"
            ? "Needs https or localhost"
            : `Missing ${support.missing.join(", ")}`}
        </Badge>
      )}
    </Stat>
  );
}
