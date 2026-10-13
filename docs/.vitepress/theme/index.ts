import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import { h } from "vue";
import Demo from "./islands/Demo.vue";
import DemoStage from "./islands/DemoStage.vue";
import CustomUplinks from "./islands/CustomUplinks.vue";
import CustomUplinksNav from "./islands/CustomUplinksNav.vue";
import Published from "./Published.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { "sidebar-nav-after": () => h(CustomUplinksNav) }),
  enhanceApp({ app }) {
    app.component("Demo", Demo);
    app.component("DemoStage", DemoStage);
    app.component("Published", Published);
    app.component("CustomUplinks", CustomUplinks);
  },
} satisfies Theme;
