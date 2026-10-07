/**
 * The generated reference pages, one module per page under `reference/pages/`.
 * A module's path is its page's path: `reference/pages/reference/ui-kit/Meter.mjs`
 * writes `docs/reference/ui-kit/Meter.md`. Every word of reference prose comes
 * from the packages' own doc comments; a page module only says which symbols
 * share the page and which examples it shows.
 *
 * A page module's default export takes one of six kinds:
 *
 * - `category`: every symbol tagged `@category <category>` in `package`, or
 *   in its subpath `entry` (`"frames"` for `@ksp-gonogo/sitrep-sdk/frames`):
 *   `lead` first, then what its doc links to, then the rest in source order
 * - `widget`: one core widget, named by its id in `widget`. Its name, its
 *   description and every other fact its registration declares come from its
 *   record in uplink-tools' `widgets.json`, and the module states none of
 *   them: generation fails on a `title` or any other record fact. Its slots
 *   are the ones the record names, typed and described by the slot and
 *   contribution registries, then the standard slots every widget carries
 * - `guide`: a hand-written page in `reference/guides/`, whose placeholders
 *   take the symbols of `category`, their `@remarks` and its `examples`. Every
 *   symbol in the category is placed exactly once, by name or by `<!-- rest -->`
 * - `contract`: C# types from the Sitrep.Contract package: those named in
 *   `types`, or `lead` then every type tagged `<category>` `category`. The
 *   compiled template region in `examples` is shown under its type
 * - `index`: a section's index (`reference/client/index.mjs`): its package's
 *   description and install line, then every page in the section with its
 *   lead's first sentence. `reference/index.mjs` lists every section instead.
 *   It takes only a `title`, so a new page appears on its index with no edit
 * - `topics`: every Topic in `package`'s `TOPIC_IDS` by prefix, with its
 *   payload type, under the summary of `lead`. The same list, and the command
 *   list from `COMMAND_IDS`, are written as includes for the guides under
 *   `docs/.vitepress/includes/`
 *
 * `examples` are the live examples at the top of the page, each an `id`, a
 * `title` when there is more than one, and the file under `reference/examples/`
 * it renders and shows (`file`, `export`), fed by `stream` when it reads
 * telemetry. A scene's `feeds` are Topic values an example file declares, put
 * on the scene's stream in place of the fixture's. A widget page's top example
 * is the widget alone on its `scene`, a render with no code, fed by its file;
 * `extensions` names the example file for each of its slots, rendered on the
 * same scene with that one extension registered; a slot whose effect depends
 * on a tile setting gives `{ file, config }`, the widget config that example
 * mounts with. A scene may carry `config` for every example on the page. `stories` names the Storybook
 * stories a widget page shows, by path under the Storybook package's
 * `dist/stories/`: `states` a widget's stories file, every story in it shown
 * as one of its states, and `extensions` the story (`file#Export`) that
 * renders each slot's scaffolding.
 */
import { readdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const PAGE_MODULES = resolve(dirname(fileURLToPath(import.meta.url)), "pages");

function pageModules(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) return pageModules(full);
      return entry.name.endsWith(".mjs") ? [full] : [];
    });
}

async function loadPages() {
  const pages = [];
  for (const file of pageModules(PAGE_MODULES)) {
    const name = `reference/pages/${relative(PAGE_MODULES, file)}`;
    const { default: page } = await import(pathToFileURL(file).href);
    if (!page?.kind) throw new Error(`${name} has no default export with a kind`);
    if ("path" in page) throw new Error(`${name} names a path; its own location is its page's path`);
    pages.push({ ...page, path: relative(PAGE_MODULES, file).replace(/\.mjs$/, ".md") });
  }
  return pages;
}

export const PAGES = await loadPages();
