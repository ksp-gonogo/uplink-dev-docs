import { useState } from "react";
import { ActionMenu, Button, Floating, type AnchorPoint } from "@ksp-gonogo/ui-kit";

export function PartMenu() {
  const [anchor, setAnchor] = useState<AnchorPoint | null>(null);
  return (
    <>
      <Button onClick={(e) => setAnchor({ x: e.clientX, y: e.clientY })}>Parachute</Button>
      {anchor && (
        <Floating anchor={anchor}>
          <ActionMenu
            ariaLabel="Parachute actions"
            style={{ position: "static" }}
            items={[
              { key: "deploy", label: "Deploy chute" },
              { key: "cut", label: "Cut chute", disabled: true },
            ]}
            onSelect={() => setAnchor(null)}
            onDismiss={() => setAnchor(null)}
          />
        </Floating>
      )}
    </>
  );
}
