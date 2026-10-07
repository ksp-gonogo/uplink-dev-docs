import { Badge, Box, Cluster, Row, Section, SectionTitle, Stack, Text, Truncate } from "@ksp-gonogo/ui-kit";

const crew = [
  { name: "Jebediah Kerman", role: "Pilot", aboard: true },
  { name: "Bill Kerman", role: "Engineer", aboard: true },
  { name: "Bob Kerman", role: "Scientist", aboard: false },
];

export function CrewPanel() {
  return (
    <Box surface="panel" pad="surface" radius="regular" bordered>
      <Stack gap="section">
        <Cluster justify="between">
          <Truncate>Mun lander</Truncate>
          <Badge tone="go">LIVE</Badge>
        </Cluster>
        <Section>
          <SectionTitle>Crew</SectionTitle>
          {crew.map((kerbal) => (
            <Row key={kerbal.name} as="div">
              <Row.Name>{kerbal.name}</Row.Name>
              <Text level="muted">{kerbal.role}</Text>
              <Badge tone={kerbal.aboard ? "go" : undefined}>
                {kerbal.aboard ? "ABOARD" : "EVA"}
              </Badge>
            </Row>
          ))}
        </Section>
      </Stack>
    </Box>
  );
}
