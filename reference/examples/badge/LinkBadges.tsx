import { Badge, Cluster } from "@ksp-gonogo/ui-kit";

export function LinkBadges() {
  return (
    <Cluster gap="related-compact">
      <Badge tone="go">Linked</Badge>
      <Badge tone="caution">Weak signal</Badge>
      <Badge tone="nogo" live>
        Burn failed
      </Badge>
      <Badge tone="offline">No link</Badge>
      <Badge>S-band</Badge>
    </Cluster>
  );
}
