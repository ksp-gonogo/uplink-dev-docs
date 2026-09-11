// #region example
import { Row, Section, SectionTitle, Text } from "@ksp-gonogo/ui-kit";

export function Resources({ units }: { units: [string, string][] }) {
  return (
    <Section>
      <SectionTitle>Resources</SectionTitle>
      {units.map(([name, amount]) => (
        <Row key={name} as="div">
          <Row.Name>{name}</Row.Name>
          <Text size="sm">{amount}</Text>
        </Row>
      ))}
    </Section>
  );
}
// #endregion example
