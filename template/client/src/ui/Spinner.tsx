// #region example
import { Inline, Spinner } from "@ksp-gonogo/ui-kit";

export function PendingRow({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Inline gap="related-compact">
      <span>{label}</span>
      {pending ? <Spinner size={12} ariaLabel="Command in flight" /> : null}
    </Inline>
  );
}
// #endregion example
