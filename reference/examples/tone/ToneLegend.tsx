import { type Tone, TONES } from "@ksp-gonogo/sitrep-sdk";
import { Badge, Inline, Stack } from "@ksp-gonogo/ui-kit";

/** A widget names the state a figure is in, and the kit decides the colour: low fuel is a warning, none is no-go. */
function toneForFuel(fraction: number): Tone {
  if (fraction <= 0) return "nogo";
  if (fraction < 0.2) return "warn";
  return "go";
}

const SAMPLES = [0.8, 0.1, 0];

export function ToneLegend() {
  return (
    <Stack gap="related-compact">
      <Inline gap="related-compact" wrap>
        {TONES.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </Inline>
      <Inline gap="related-compact" wrap>
        {SAMPLES.map((fraction) => (
          <Badge key={fraction} tone={toneForFuel(fraction)}>
            {`${Math.round(fraction * 100)}% fuel`}
          </Badge>
        ))}
      </Inline>
    </Stack>
  );
}
