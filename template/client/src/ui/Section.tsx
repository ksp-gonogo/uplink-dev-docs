// #region example
import { Row, Section, SectionTitle, Value } from "@ksp-gonogo/ui-kit";

export function Resources({ units }: { units: [string, string][] }) {
  return (
    <Section>
      <SectionTitle>Resources</SectionTitle>
      {units.map(([name, amount]) => (
        <Row key={name} as="div">
          <Row.Name>{name}</Row.Name>
          <Value size="sm">{amount}</Value>
        </Row>
      ))}
    </Section>
  );
}
// #endregion example
