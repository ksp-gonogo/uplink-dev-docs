import { value } from "@ksp-gonogo/sitrep-sdk";
import { DataTable } from "@ksp-gonogo/ui-kit";

const BURNS = [
  { id: "circ", name: "Circularise", dv: 42, time: 18 },
  { id: "inc", name: "Plane change", dv: 118, time: 52 },
  { id: "tmi", name: "Transfer injection", dv: 862, time: 340 },
];

export function Burns() {
  return (
    <DataTable
      caption="Planned burns"
      rows={BURNS}
      rowKey={(burn) => burn.id}
      columns={[
        { key: "name", header: "Burn", rowHeader: true, render: (burn) => burn.name },
        { key: "dv", header: "Delta-v", align: "end", value: (burn) => value("m/s", burn.dv) },
        { key: "time", header: "Duration", align: "end", value: (burn) => value("s", burn.time) },
      ]}
    />
  );
}
