import { defineConfig } from "vitepress";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const modules = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../node_modules",
);

/**
 * Read straight off disk rather than through `require(pkg + "/package.json")`:
 * the SDK's `exports` map has one key and does not expose its own manifest, the
 * same defect `guide/limits` documents. Read it the way a human would.
 */
function installedVersion(name: string): string {
  const manifest = join(modules, ...name.split("/"), "package.json");
  return JSON.parse(readFileSync(manifest, "utf8")).version;
}

/**
 * The versions these pages describe, read from the packages the snippet gate
 * actually compiled against rather than typed in by hand.
 *
 * A reader has no other way to tell. There is one live doc set, built from
 * whatever is current, and the two package versions have not moved since they
 * were first published, so "latest" identifies nothing on its own. Sourcing the
 * number from `node_modules` means the footer cannot disagree with the snippets
 * above it: bump a dependency and the statement moves with it, or it does not
 * move because nothing did.
 *
 * The contract version (`CONTRACT_MAJOR`/`CONTRACT_MINOR`), which is what an
 * Uplink's compat gate actually checks, is deliberately absent: the published
 * SDK does not export it and the mod that would carry it is not released. Once
 * either ships one, name it here.
 */
const documents = ["@ksp-gonogo/sitrep-sdk", "@ksp-gonogo/ui-kit"]
  .map((name) => `${name}@${installedVersion(name)}`)
  .join(" &middot; ");

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
];

export default defineConfig({
  title: "Gonogo Uplink Docs",
  description: "Documentation for creating your own Gonogo Uplink",
  base: "/uplink-dev-docs/",

  // The palette is dark-only on purpose (see theme/custom.css), so offering a
  // toggle would hand the reader a half-styled light page built from tokens that
  // were never defined for it.
  appearance: "force-dark",
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
          text: "Plugin",
          items: [
            { text: "The plugin class", link: "/guide/plugin" },
            { text: "Publishing a Topic", link: "/guide/topics" },
            { text: "Accepting a command", link: "/guide/commands" },
            { text: "Build and install", link: "/guide/build" },
          ],
        },
        {
          text: "Client",
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
    footer: {
      message: `Describes ${documents}`,
    },
  },
});
