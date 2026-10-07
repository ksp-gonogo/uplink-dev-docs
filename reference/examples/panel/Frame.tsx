import { value } from "@ksp-gonogo/sitrep-sdk";
import { Panel, Section, Stack, Text, Unit } from "@ksp-gonogo/ui-kit";

export function Frame() {
  return (
    <div style={{ height: 360 }}>
    <Panel
      panelTitle="Fuel status"
      compactTitle="Fuel"
      panelBadges={[{ id: "low", label: "Low", tone: "warn" }]}
      panelFooter={
        <Text>
          Total <Unit value={value("units", 1260)} />
        </Text>
      }
      sections={[
        <Section key="stages" title="Stages">
          <Stack gap="rows">
            <Text>Stage 2: 360 units</Text>
            <Text>Stage 1: 900 units</Text>
          </Stack>
        </Section>,
        <Section key="tanks" title="Tanks">
          <Text>Four tanks, none empty</Text>
        </Section>,
      ]}
    />
    </div>
  );
}
