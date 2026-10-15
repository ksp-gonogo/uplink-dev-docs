import {
  CatalogContact,
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge, Text } from "@ksp-gonogo/ui-kit";

// In an Uplink this call is `src/uplink.ts`, which exports `uplink`; its `id` is the plugin's own.
const uplink = defineUplinkClient({
  id: "fleetsilencenotes",
  version: "1.0.0",
  name: "Fleet Silence Notes",
  description: "Adds a note to the Fleet Roster updates when a vessel has gone silent.",
});

const CONTACT_LABEL: Record<CatalogContact, string> = {
  [CatalogContact.InContact]: "In contact",
  [CatalogContact.Silent]: "Silent",
  [CatalogContact.Overdue]: "Overdue",
  [CatalogContact.Lost]: "Lost",
  [CatalogContact.Gone]: "Gone",
};

function SilenceNote({
  vesselId,
  compact,
}: SlotProps<"fleet-roster.updates">) {
  const catalog = useTelemetry("trackingStation.catalog");
  if (catalog.state !== "observed") return null;
  const entry = catalog.value.entries.find((e) => e.vesselId === vesselId);
  // `contact` is absent where no word of any route to the craft has reached this centre, and that is not "in contact".
  const contact = entry?.contact;
  if (contact === undefined || contact === null || contact === CatalogContact.InContact) return null;
  const label = CONTACT_LABEL[contact];
  if (compact) {
    return (
      <Badge tone="warn" size="sm">
        {label}
      </Badge>
    );
  }
  const overdueAfter = entry?.overdueAfterUt;
  return (
    <Text size="sm" level="muted">
      {overdueAfter == null ? "Not answering" : `Not answering, overdue after UT ${Math.round(overdueAfter.magnitude)}`}
    </Text>
  );
}

registerAugment({
  id: "fleet-silence-note",
  augments: "fleet-roster.updates",
  component: SilenceNote,
  channels: ["trackingStation.catalog"],
  owner: uplink,
});
