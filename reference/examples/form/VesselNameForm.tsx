import { useState } from "react";
import {
  Button,
  ConfigForm,
  Field,
  FieldHint,
  FieldLabel,
  FormActions,
  Input,
  Select,
  Switch,
} from "@ksp-gonogo/ui-kit";

export function VesselNameForm() {
  const [name, setName] = useState("Kerbal X");
  const [frame, setFrame] = useState("surface");
  const [follow, setFollow] = useState(true);
  return (
    <ConfigForm>
      <Field>
        <FieldLabel htmlFor="vessel-name">Vessel name</FieldLabel>
        <Input id="vessel-name" value={name} onChange={(e) => setName(e.target.value)} />
        <FieldHint>Shown in the header of every panel.</FieldHint>
      </Field>
      <Field>
        <FieldLabel htmlFor="read-frame">Read frame</FieldLabel>
        <Select id="read-frame" value={frame} onChange={(e) => setFrame(e.target.value)}>
          <option value="surface">Surface</option>
          <option value="orbit">Orbit</option>
        </Select>
      </Field>
      <Switch label="Follow the active vessel" checked={follow} onChange={setFollow} />
      <FormActions>
        <Button variant="primary">Save</Button>
      </FormActions>
    </ConfigForm>
  );
}
