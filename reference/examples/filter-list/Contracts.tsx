import { Card, FilterList } from "@ksp-gonogo/ui-kit";

const CONTRACTS = [
  { id: "a", title: "Orbit the Mun", agency: "Kerbal Space Program" },
  { id: "b", title: "Test the engine in flight", agency: "Rockomax" },
  { id: "c", title: "Rescue Valentina", agency: "Kerbal Space Program" },
];

export function Contracts() {
  return (
    <FilterList
      emptyLabel="No contracts match"
      rows={CONTRACTS.map((c) => ({
        id: c.id,
        searchText: `${c.title} ${c.agency}`,
        node: <Card title={c.title}>{c.agency}</Card>,
      }))}
    />
  );
}
