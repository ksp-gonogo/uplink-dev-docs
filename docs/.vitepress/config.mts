import { defineConfig } from "vitepress";
import { islandVite } from "./islands.mts";
import { symbolLinks } from "./symbolLinks.mts";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type SidebarItem = { text: string; link: string };

/**
 * The generated reference pages' sidebar entries by directory, as
 * `npm run reference` last wrote them. None before the first run.
 */
const sidebarFile = resolve(dirname(fileURLToPath(import.meta.url)), "sidebar.generated.json");
const generatedSidebar: Record<string, SidebarItem[]> = existsSync(sidebarFile)
  ? JSON.parse(readFileSync(sidebarFile, "utf8"))
  : {};

/** A section's hand pages and its generated pages, in name order after an optional first entry. */
function section(dir: string, hand: SidebarItem[], first?: SidebarItem): SidebarItem[] {
  const items = [...hand, ...(generatedSidebar[dir] ?? [])].sort((a, b) => a.text.localeCompare(b.text));
  return first ? [first, ...items] : items;
}

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
  "Badge",
  "Box",
  "Button",
  "Card",
  "Cluster",
  "EmptyState",
  "Grid",
  "Inline",
  "Panel",
  "Readout",
  "Row",
  "Section",
  "Spinner",
  "Stack",
  "StatusIndicator",
  "Text",
  "Truncate",
  "Unit",
];

export default defineConfig({
  title: "Gonogo Uplink Docs",
  description: "Documentation for creating your own Gonogo Uplink",
  base: "/uplink-dev-docs/",

  // The palette is dark-only on purpose (see theme/custom.css), so offering a
  // toggle would hand the reader a half-styled light page built from tokens that
  // were never defined for it.
  appearance: "force-dark",
  vite: islandVite(),
  markdown: { config: symbolLinks },
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
            { text: "Extensions", link: "/guide/extensions" },
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
          items: section("reference/mod", [
            { text: "IUplinkHost", link: "/reference/mod/host" },
            { text: "Channels", link: "/reference/mod/channels" },
            { text: "Commands", link: "/reference/mod/commands" },
            { text: "Kernel", link: "/reference/mod/kernel" },
          ]),
        },
        {
          text: "Client SDK",
          items: section(
            "reference/client",
            [
              { text: "Messages", link: "/reference/client/messages" },
              { text: "Topics", link: "/reference/client/topics" },
              { text: "Binary frames", link: "/reference/client/binary-frames" },
            ],
            { text: "Package contents", link: "/reference/client/" },
          ),
        },
        {
          text: "Widgets",
          items: section("reference/widgets", []),
        },
        ...(generatedSidebar["reference/tools"] ? [{ text: "uplink-tools", items: section("reference/tools", []) }] : []),
        {
          text: "ui-kit",
          items: [
            ...section(
              "reference/ui-kit",
              primitives.map((name) => ({ text: name, link: `/reference/ui-kit/${name}` })),
              { text: "Setup", link: "/reference/ui-kit/" },
            ),
            { text: "Theme", link: "/reference/ui-kit/theme" },
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
