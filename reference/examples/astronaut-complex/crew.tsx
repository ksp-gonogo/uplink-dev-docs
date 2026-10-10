import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { Text } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-training",
  version: "1.0.0",
  name: "Crew Training",
  description: "Adds a training course to each kerbal in the Astronaut Complex.",
});

const COURSES: Record<string, string> = {
  "Desdin Kerman": "Orbital rendezvous, week 2 of 4",
  "Limmy Kerman": "Parachute packing, week 1 of 3",
};

function Course({ kerbalName }: SlotProps<"astronaut-complex.crew">) {
  const course = COURSES[kerbalName];
  if (!course) return null;
  return (
    <Text size="sm" level="muted">
      {course}
    </Text>
  );
}

registerAugment({
  id: "crew-training-course",
  augments: "astronaut-complex.crew",
  component: Course,
  owner: uplink,
});
