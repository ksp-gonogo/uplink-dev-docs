import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Badge, Cluster, Stat } from "@ksp-gonogo/ui-kit";

export function CurrentScene() {
  const scene = useTelemetry("spaceCenter.scene");
  if (scene.state !== "observed" || !scene.value) return null;
  return (
    <Cluster>
      <Stat label="Scene">{scene.value.scene ?? "Unknown"}</Stat>
      <Badge tone={scene.value.scene === "Flight" ? "go" : "neutral"}>
        {scene.value.scene === "Flight" ? "Flying" : "Not flying"}
      </Badge>
    </Cluster>
  );
}
