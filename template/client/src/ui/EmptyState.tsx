// #region example
import { EmptyState, Stack } from "@ksp-gonogo/ui-kit";

export function ContactList({ contacts }: { contacts: string[] }) {
  if (contacts.length === 0) {
    return <EmptyState layout="fill">No contacts in range</EmptyState>;
  }
  return (
    <Stack gap="related-compact">
      {contacts.map((contact) => (
        <span key={contact}>{contact}</span>
      ))}
    </Stack>
  );
}
// #endregion example
