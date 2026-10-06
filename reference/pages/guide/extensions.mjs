import { CREW_SCENE } from "../reference/widgets/crew-status.mjs";

export default {
  kind: "guide",
  source: "reference/guides/extensions.md",
  package: "@ksp-gonogo/sitrep-sdk",
  category: "Extensions",
  examples: [
    {
      id: "crew-status--avatar",
      file: "reference/examples/crew-status/avatar.tsx",
      widget: "crew-status",
      scene: CREW_SCENE,
    },
    {
      id: "crew-status--meters",
      file: "reference/examples/crew-status/meters.ts",
      widget: "crew-status",
      scene: CREW_SCENE,
    },
  ],
};
