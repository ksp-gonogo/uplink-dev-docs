// npm install @ksp-gonogo/sitrep-sdk @ksp-gonogo/ui-kit
import {
  registerSetting,
  SettingKind,
  SettingsProvider,
  SettingsService,
  useSetting,
} from "@ksp-gonogo/sitrep-sdk";
import { Button, Stack, Text } from "@ksp-gonogo/ui-kit";

registerSetting({
  id: "habitat-show-crew-days",
  label: "Show crew days",
  description: "Draws the days of supplies left beside the crew count.",
  category: "Habitat",
  defaultValue: true,
});

registerSetting({
  id: "habitat-warn-below-days",
  label: "Warn below",
  description: "The days of supplies left under which the figure is drawn as a warning.",
  category: "Habitat",
  type: SettingKind.Number,
  defaultValue: 3,
});

registerSetting({
  id: "habitat-link-up",
  label: "Link to the command centre",
  category: "Habitat",
  backing: "stream-backed",
  // comms.connectivity is the Comms page's Topic for the vessel's link home; `select` picks its `connected` field, whether a control path home exists.
  topic: "comms.connectivity",
  select: (connectivity) => connectivity.connected,
});

// The dashboard mounts one SettingsProvider for its widgets, so a widget needs none of this wrapper; it is here only so this example renders on its own.
const service = new SettingsService();

function CrewDays() {
  const [show, setShow] = useSetting<boolean>("habitat-show-crew-days");
  const [warnBelow] = useSetting<number>("habitat-warn-below-days");
  return (
    <Stack gap="related-compact">
      <Button onClick={() => setShow(!show)}>{show ? "Hide crew days" : "Show crew days"}</Button>
      {show ? <Text>12 days of supplies, warning below {warnBelow}</Text> : null}
    </Stack>
  );
}

export function CrewDaysSetting() {
  return (
    <SettingsProvider service={service}>
      <CrewDays />
    </SettingsProvider>
  );
}
