# ScienceExperimentRow

A complete science-instrument row: name, state badges, and a Deploy/Transmit action cluster with the arm-then-confirm handshake already built.

```ts
interface ScienceInstrument {
  partId: string;
  partTitle: string;
  expId: string;
  deployed: boolean;
  hasData: boolean;
  rerunnable: boolean;
  inoperable: boolean;
}

interface ScienceExperimentRowProps {
  instrument: ScienceInstrument;
  onDeploy?: (partId: string) => void;
  onTransmit?: (partId: string) => void;
}
```

<<< ../../../template/client/src/ui/ScienceExperimentRow.tsx#example

`onTransmit` fires only after the operator confirms, never off a bare click. The arm and pending state is the component's own; the dispatch is yours.

`ScienceInstrument` is already normalised: plain booleans, no optionals. Map your parsed data onto it rather than passing a wire payload through.

It is the widget-facing shape of the SDK's `science.instruments` payload, not that payload itself.
