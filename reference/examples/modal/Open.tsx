import { Button, ModalProvider, Text, useModal } from "@ksp-gonogo/ui-kit";

function OpenButton() {
  const modal = useModal();
  return (
    <Button onClick={() => modal.open(<Text>Nothing to configure.</Text>, { title: "Settings" })}>
      Open settings
    </Button>
  );
}

export function Open() {
  return (
    <ModalProvider>
      <OpenButton />
    </ModalProvider>
  );
}
