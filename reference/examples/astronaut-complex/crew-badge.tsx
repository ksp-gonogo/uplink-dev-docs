import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-nerve",
  version: "1.0.0",
  name: "Crew Nerve",
});

const FEARLESS = 0.6;

function FearlessBadge({
  kerbalName,
  isApplicant,
}: SlotProps<"astronaut-complex.crew-badge">) {
  const complex = useTelemetry("spaceCenter.astronautComplex");
  if (!isApplicant || complex.state !== "observed") return null;
  const applicant = complex.value.applicants.find(
    (candidate) => candidate.name === kerbalName,
  );
  if (!applicant?.courage || applicant.courage.magnitude < FEARLESS) return null;
  return (
    <Badge tone="go" size="sm">
      Fearless
    </Badge>
  );
}

registerAugment({
  id: "crew-nerve-fearless",
  augments: "astronaut-complex.crew-badge",
  component: FearlessBadge,
  channels: ["spaceCenter.astronautComplex"],
  owner: uplink,
});
