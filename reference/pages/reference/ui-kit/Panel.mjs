import { CREW_SCENE } from "../widgets/crew-status.mjs";

export default {
  kind: "category",
  title: "Panel",
  package: "@ksp-gonogo/ui-kit",
  category: "Panel",
  lead: "Panel",
  examples: [
    { id: "panel--frame", title: "A panel with sections, badges and a footer", file: "reference/examples/panel/Frame.tsx", export: "Frame" },
    { id: "panel--sections", title: "Adding a section to a widget", file: "reference/examples/panel/sections.tsx", widget: "crew-status", scene: CREW_SCENE },
    { id: "panel--actions", title: "Adding a control to a widget's header", file: "reference/examples/panel/actions.tsx", widget: "crew-status", scene: CREW_SCENE },
    { id: "panel--badges", title: "Adding a badge to a widget's header", file: "reference/examples/panel/badges.ts", widget: "crew-status", scene: CREW_SCENE },
  ],
};
