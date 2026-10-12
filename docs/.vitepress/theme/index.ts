import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Demo from "./islands/Demo.vue";
import DemoStage from "./islands/DemoStage.vue";
import UplinkViewer from "./islands/UplinkViewer.vue";
import Published from "./Published.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Demo", Demo);
    app.component("DemoStage", DemoStage);
    app.component("Published", Published);
    app.component("UplinkViewer", UplinkViewer);
  },
} satisfies Theme;
