import { value } from "@ksp-gonogo/sitrep-sdk";
import { TinyEssentials } from "@ksp-gonogo/ui-kit";

export function TinyVessel() {
  return (
    <div style={{ width: 160, height: 120 }}>
      <TinyEssentials
        title="Vessel"
        essentials={[
          { label: "ALT", value: value("m", 84200) },
          { label: "ΔV", value: value("m/s", 3120) },
          { label: "COMMS", word: "ACTIVE" },
        ]}
      />
    </div>
  );
}
