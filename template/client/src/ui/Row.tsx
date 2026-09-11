// #region example
import { Badge, Row } from "@ksp-gonogo/ui-kit";

export function CrewList({ crew }: { crew: string[] }) {
  return (
    <ul>
      {crew.map((name) => (
        <Row key={name}>
          <Row.Name>{name}</Row.Name>
          <Badge severity="nominal">ABOARD</Badge>
        </Row>
      ))}
    </ul>
  );
}
// #endregion example
