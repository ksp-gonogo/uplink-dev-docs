import { CREW_SCENE } from "../widgets/crew-status.mjs";

export default {
  kind: "category",
  title: "Extensions",
  package: "@ksp-gonogo/ui-kit",
  category: "Extensions",
  lead: "useContributions",
  examples: [
    { id: "extensions--settings", file: "reference/examples/extensions/settings.tsx", widget: "crew-status", scene: CREW_SCENE },
  ],
};
