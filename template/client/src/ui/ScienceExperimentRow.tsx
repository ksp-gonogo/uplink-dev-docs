// #region example
import {
  ScienceExperimentRow,
  type ScienceInstrument,
} from "@ksp-gonogo/ui-kit";

export function Instruments({
  instruments,
  onDeploy,
}: {
  instruments: ScienceInstrument[];
  onDeploy: (partId: string) => void;
}) {
  return (
    <ul>
      {instruments.map((instrument) => (
        <ScienceExperimentRow
          key={instrument.partId}
          instrument={instrument}
          onDeploy={onDeploy}
        />
      ))}
    </ul>
  );
}
// #endregion example
