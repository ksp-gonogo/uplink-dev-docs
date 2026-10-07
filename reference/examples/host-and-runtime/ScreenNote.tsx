import { useScreen } from "@ksp-gonogo/sitrep-sdk";
import { Badge } from "@ksp-gonogo/ui-kit";

export function ScreenNote() {
  const screen = useScreen();
  return <Badge tone={screen === "main" ? "go" : "info"}>{screen === "main" ? "Main screen" : `On the ${screen} screen`}</Badge>;
}
