import {
  defineUplinkClient,
  registerAugment,
} from "@ksp-gonogo/sitrep-sdk";
import { Button } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-roster",
  version: "1.0.0",
  name: "Crew Roster",
});

registerAugment({
  id: "crew-roster-open",
  augments: "crew-status.actions",
  component: () => <Button size="sm">Open roster</Button>,
  owner: uplink,
});
