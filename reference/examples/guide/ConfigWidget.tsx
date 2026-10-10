import { type ConfigComponentProps, defineUplinkClient, registerComponent, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { ConfigForm, Panel, Section, Switch, Text, Unit, useModalSaveBar } from "@ksp-gonogo/ui-kit";
import { useMemo, useState } from "react";

const uplink = defineUplinkClient({
  id: "altitude-board-settings",
  version: "1.0.0",
  name: "Altitude Board",
  description: "A widget that draws the craft's altitude, with settings an operator changes.",
});

interface AltitudeConfig {
  showVerticalSpeed: boolean;
}

function AltitudeConfigForm({ config, onSave }: ConfigComponentProps<AltitudeConfig>) {
  const [showVerticalSpeed, setShowVerticalSpeed] = useState(config.showVerticalSpeed);
  const draft = useMemo(() => ({ showVerticalSpeed }), [showVerticalSpeed]);
  useModalSaveBar({ onSave: () => onSave(draft), value: draft, saved: config });
  return (
    <ConfigForm>
      <Switch label="Show vertical speed" checked={showVerticalSpeed} onChange={setShowVerticalSpeed} />
    </ConfigForm>
  );
}

function AltitudeBoard({ config }: Readonly<{ config?: AltitudeConfig }>) {
  const flight = useTelemetry("vessel.flight");
  return (
    <Panel
      panelTitle="Altitude"
      sections={
        <Section>
          <Unit value={flight.altitudeAsl} />
          {config?.showVerticalSpeed ? <Unit value={flight.verticalSpeed} /> : <Text level="muted">Vertical speed hidden</Text>}
        </Section>
      }
    />
  );
}

registerComponent<AltitudeConfig>({
  id: "altitude-board-settings",
  name: "Altitude Board",
  description: "The craft's altitude, with vertical speed an operator can switch on in the widget's settings.",
  tags: ["telemetry"],
  component: AltitudeBoard,
  configComponent: AltitudeConfigForm,
  defaultConfig: { showVerticalSpeed: false },
  channels: ["vessel.flight"],
  defaultSize: { w: 3, h: 2 },
  owner: uplink,
});
