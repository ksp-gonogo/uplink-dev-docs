import { Tabs, Text } from "@ksp-gonogo/ui-kit";

export function Systems() {
  return (
    <Tabs
      aria-label="Vessel systems"
      tabs={[
        { id: "power", label: "Power", content: <Text>Batteries at 82%</Text> },
        { id: "comms", label: "Comms", content: <Text>Antenna deployed</Text>, indicator: true },
        { id: "science", label: "Science", content: <Text>No experiments</Text>, disabled: true },
      ]}
    />
  );
}
