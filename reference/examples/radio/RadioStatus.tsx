import { radioSupportStatus } from "@ksp-gonogo/sitrep-sdk/media";
import { Badge, Stat } from "@ksp-gonogo/ui-kit";
import { useState } from "react";

export function RadioStatus() {
  // The browser's support does not change while the page is open, so it is read once.
  const [support] = useState(radioSupportStatus);
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
