import { defineConfig } from "vitepress";
import { islandVite } from "./islands.mts";
import { symbolLinks } from "./symbolLinks.mts";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type SidebarItem = { text: string; link: string; index?: boolean };

/**
 * The generated reference pages' sidebar entries by directory, as
 * `npm run reference` last wrote them. None before the first run.
 */
const sidebarFile = resolve(dirname(fileURLToPath(import.meta.url)), "sidebar.generated.json");
const generatedSidebar: Record<string, SidebarItem[]> = existsSync(sidebarFile)
  ? JSON.parse(readFileSync(sidebarFile, "utf8"))
  : {};

/** A section's generated pages, its index first. */
function section(dir: string): SidebarItem[] {
  return (generatedSidebar[dir] ?? []).map(({ text, link }) => ({ text, link }));
}

/**
 * What an author installs today to get the surface these pages document, from
 * `reference/artifacts.json`, the one place the version is written. Guide prose
 * reads it through the `Published` component; the generated pages read the same file.
 */
const published: { version: string; npmTag: string; name: string; pending?: string[] } = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../reference/artifacts.json"), "utf8"),
).published;

const documents = ["@ksp-gonogo/sitrep-sdk", "@ksp-gonogo/ui-kit"]
  .map((name) => `${name}@${published.version}`)
  .join(" &middot; ");

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
    published,
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
        ...(generatedSidebar["reference/concepts"] ? [{ text: "Concepts", items: section("reference/concepts") }] : []),
        {
          text: "Mod API",
          items: section("reference/mod"),
        },
        {
          text: "Client SDK",
          items: section("reference/client"),
        },
        {
          text: "Widgets",
          items: section("reference/widgets"),
        },
        ...(generatedSidebar["reference/tools"] ? [{ text: "uplink-tools", items: section("reference/tools") }] : []),
        {
          text: "ui-kit",
          items: section("reference/ui-kit"),
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
