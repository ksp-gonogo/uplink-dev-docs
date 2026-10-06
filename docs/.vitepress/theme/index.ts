import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Demo from "./islands/Demo.vue";
import DemoStage from "./islands/DemoStage.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Demo", Demo);
    app.component("DemoStage", DemoStage);
  },
} satisfies Theme;
