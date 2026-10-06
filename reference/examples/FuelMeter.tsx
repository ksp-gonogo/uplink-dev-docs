import { value } from "@ksp-gonogo/sitrep-sdk";
import { Meter } from "@ksp-gonogo/ui-kit";

export function FuelMeter() {
  return (
    <Meter
      label="Liquid fuel"
      value={value("units", 1260)}
      capacity={value("units", 3600)}
    />
  );
}
