// #region example
import { Badge, Cluster, Truncate } from "@ksp-gonogo/ui-kit";

export function TitleRow({ title, state }: { title: string; state: string }) {
  return (
    <Cluster justify="between" gap="sm">
      <Truncate>{title}</Truncate>
      <Badge tone="neutral">{state}</Badge>
    </Cluster>
  );
}
// #endregion example
