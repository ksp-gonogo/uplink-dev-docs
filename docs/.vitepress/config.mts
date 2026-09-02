import { defineConfig } from "vitepress";

const primitives = [
  "ActionButton",
  "Badge",
  "Box",
  "Card",
  "Cluster",
  "EmptyState",
  "Grid",
  "Inline",
  "Panel",
  "ProgressBar",
  "Readout",
  "Row",
  "ScienceExperimentRow",
  "Section",
  "Spinner",
  "Stack",
  "StatusIndicator",
  "Truncate",
  "Value",
  "WidgetHeader",
];

export default defineConfig({
  title: "Gonogo Uplink Docs",
  description: "Documentation for creating your own Gonogo Uplink",
  base: "/uplink-dev-docs/",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Reference", link: "/reference/" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "What an Uplink is", link: "/guide/" },
            { text: "Prerequisites", link: "/guide/prerequisites" },
            { text: "Project layout", link: "/guide/project-layout" },
          ],
        },
        {
          text: "The plugin",
          items: [
            { text: "The plugin class", link: "/guide/plugin" },
            { text: "Publishing a Topic", link: "/guide/topics" },
            { text: "Accepting a command", link: "/guide/commands" },
            { text: "Build and install", link: "/guide/build" },
          ],
        },
        {
          text: "The client",
          items: [
            { text: "Connecting", link: "/guide/client-stream" },
            { text: "Reading a Topic", link: "/guide/client-topics" },
            { text: "Sending a command", link: "/guide/client-commands" },
            { text: "Building the UI", link: "/guide/client-ui" },
          ],
        },
        {
          text: "Shipping",
          items: [
            { text: "Distribution", link: "/guide/distribution" },
            { text: "Known limits", link: "/guide/limits" },
          ],
        },
      ],
      "/reference/": [
        { text: "Reference", link: "/reference/" },
        {
          text: "Mod API",
          items: [
            { text: "ISitrepUplink", link: "/reference/mod/" },
            { text: "IUplinkHost", link: "/reference/mod/host" },
            { text: "Channels", link: "/reference/mod/channels" },
            { text: "Commands", link: "/reference/mod/commands" },
            { text: "Kernel", link: "/reference/mod/kernel" },
          ],
        },
        {
          text: "Client SDK",
          items: [
            { text: "Package contents", link: "/reference/client/" },
            { text: "Messages", link: "/reference/client/messages" },
            { text: "Topics", link: "/reference/client/topics" },
          ],
        },
        {
          text: "ui-kit",
          items: [
            { text: "Setup", link: "/reference/ui-kit/" },
            ...primitives.map((name) => ({
              text: name,
              link: `/reference/ui-kit/${name}`,
            })),
            { text: "Theme", link: "/reference/ui-kit/theme" },
            { text: "formatNumber", link: "/reference/ui-kit/formatNumber" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/ksp-gonogo/gonogo" },
    ],
    search: { provider: "local" },
  },
});
