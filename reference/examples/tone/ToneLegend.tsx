import { TONES } from "@ksp-gonogo/sitrep-sdk";
import { Badge, Inline } from "@ksp-gonogo/ui-kit";

export function ToneLegend() {
  return (
    <Inline gap="related-compact" wrap>
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </Inline>
  );
}
