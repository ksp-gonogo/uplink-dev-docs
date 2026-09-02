// #region example
import { Badge, Row } from "@ksp-gonogo/ui-kit";

export function CrewList({ crew }: { crew: string[] }) {
  return (
    <ul>
      {crew.map((name) => (
        <Row key={name}>
          <Row.Name>{name}</Row.Name>
          <Badge tone="go">ABOARD</Badge>
        </Row>
      ))}
    </ul>
  );
}
// #endregion example
