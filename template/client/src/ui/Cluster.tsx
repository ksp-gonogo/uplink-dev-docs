// #region example
import { Badge, Cluster, Truncate } from "@ksp-gonogo/ui-kit";

export function TitleRow({ title, state }: { title: string; state: string }) {
  return (
    <Cluster justify="between" gap="related">
      <Truncate>{title}</Truncate>
      <Badge>{state}</Badge>
    </Cluster>
  );
}
// #endregion example
