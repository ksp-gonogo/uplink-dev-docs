# Gonogo Uplink developer documentation

A guide and reference for building a Gonogo Uplink: the KSP plugin half in C#,
and the browser client half in React.

Published with VitePress to GitHub Pages.

## Running it

```bash
npm install
npm run dev      # local site
npm run check    # compile every snippet
npm run build    # check, then build to docs/.vitepress/dist
```

## The dependency rule

The Guide's worked Uplink, `example/`, depends on **published packages only**:
`@ksp-gonogo/sitrep-sdk`, `@ksp-gonogo/ui-kit` and `@ksp-gonogo/uplink-tools`
from npm and `KspGonogo.Sitrep.Contract` from nuget.org, at the release
candidate `reference/artifacts.json` names, plus React, styled-components and
third-party packages. No workspace links, no `file:` dependencies, no path into
another checkout.

That is what makes a compiling snippet mean something. If a page cannot be
written without reaching past the published surface, the finding is that the
published surface is insufficient, and it belongs in `docs/guide/limits.md`
rather than being worked around.

## How snippets are checked

Pages never contain hand-copied code that is meant to compile. Every snippet in
the Guide is transcluded from a file under `example/`, and every reference
example from `reference/examples/`, using VitePress's `<<< path#region`
include.

`example/` is `uplink-tools new example` as the published package writes it,
plus the files the Guide adds or edits, each listed in
`scripts/check-example.mjs` with the page that changes it. After changing one,
run its own commands in `example/client/` (`npm run codegen`, `npm run page`,
`npm test`, `dotnet test ../mod-tests`) and commit what they write.

`npm run check` runs these gates. Every one of them runs whatever the ones
before it did, and the verdict line at the end names each that failed: they go
stale independently, so a red compile must not take the others offline with it.

| Gate | Checks |
| --- | --- |
| the worked Uplink | `new` run again writes exactly the example's files, bar the listed edits; then `npm ci`, `bake`, `codegen:check`, `typecheck`, `npm test` and `dotnet test mod-tests` in it. Needs the .NET SDK and the network |
| reference examples | Every file under `reference/examples/` typechecks against the packed artifacts, and the mod examples build against the packed contract |
| include scan | Every `<<<` in `docs/` resolves to a real file, and to a real `#region` when one is named |
| documented symbols | Every reference page has a live subject, every symbol it names is one the kit exports, and every internal link lands |
| reference pages | Every page under `docs/reference/` is generated, and none is edited or committed |

Each gate grades a planted fault first, and reports BLIND if it does not find it.

The include scan exists because VitePress renders a missing include as an error block
inside the page instead of failing the build, so a broken include would ship
looking like content.

The symbol check exists because nothing else can see a page for a component that has
been deleted. Markdown compiles against nothing, and neither client pass can
stand in for it: they compile the example, not the names in the prose, and the
release candidate on npm can lag the kit these pages describe. That check therefore reads
its truth from `packages/ui-kit/src/index.ts` in a gonogo checkout, through the
TypeScript checker so `export *` chains are followed rather than guessed.

The export list is committed as `scripts/ui-kit-exports.json` and the pages
are graded against that, so the check runs without a checkout. A run that CAN
reach one also verifies the snapshot against source in the same pass, which is
what stops the committed copy from quietly agreeing with itself. CI always can:
`pages.yml` sparse-checks-out gonogo's `staging` and sets `GONOGO_REPO`, and
with `CI=true` a missing checkout fails rather than skipping.

```bash
npm run check:symbols                 # this gate alone
npm run sync:ui-kit-exports           # regenerate the snapshot; never hand-edit it
GONOGO_REPO=/path/to/gonogo npm run check:symbols   # a checkout that is not a sibling
GONOGO_REPO=off npm run check:symbols               # exercise the CI path
GONOGO_REPO=off npm run check                       # a machine with no checkout, source pass skipped
```

Known staleness lives in `scripts/doc-symbols-debt.mjs` as two ceilings. They
shrink, never grow: a page added to one is a bug written down instead of fixed.

`vitepress build` fails on a dead internal link but not on a dead anchor.
After the build, `npm run check:rendered` fails on either, and on a page whose
server render left it empty.

After the build, `npm run check:links` reads the built site. Every inline code
span naming a documented symbol must link to its reference entry, and every
such link, anchor included, must land. The Markdown pass in
`docs/.vitepress/symbolLinks.mts` writes those links on every page from the
index `npm run reference` writes, so prose links a symbol by naming it in
backticks. A `{@link}` in a doc comment to a symbol with no reference entry
fails `npm run reference`, bar the ceiling in `scripts/symbol-link-debt.mjs`.

## The generated reference

Most of `docs/reference/` is generated and never edited. Each generated page is
a module under `reference/pages/`, at the page's own path:
`reference/pages/reference/ui-kit/Meter.mjs` writes
`docs/reference/ui-kit/Meter.md`. The pages are build output written from
package artifacts only, never from a gonogo source path, and they keep
themselves out of git (`docs/.gitignore`, written with them).

```bash
npm run reference:pack   # pnpm pack + dotnet pack from a gonogo checkout, into artifacts/
npm run reference        # install the artifacts into .reference/, then write the pages
```

`reference/artifacts.json` names each package as a `file:` tarball, and
`gonogo` there pins the commit CI packs them from. When the release candidates
are published it names versions instead, and the pack step and the pin go
away.

- **TypeScript**: TypeDoc reads the packed `.d.ts` and its TSDoc;
  `scripts/reference/typescript.mjs` writes the Markdown, because a page here
  is a composition (a `@category`, a component's props, one widget's registry
  keys) rather than one file per declaration
- **Widgets**: each core widget's record, in the packed
  `@ksp-gonogo/uplink-tools/widgets.json`, heads its page. An Uplink README's
  widget sections are written from the same kind of record
- **C#**: xmldocmd reads `Sitrep.Contract.dll` and its XML doc file out of the
  `KspGonogo.Sitrep.Contract` NuGet package; `scripts/reference/csharp.mjs`
  composes its per-member files into one page
- **Live examples**: each is a typechecked file under `reference/examples/`,
  importing only the published packages, mounted as a React island
  (`docs/.vitepress/theme/islands/`) in the app's own styling beside its code.
  A widget page also shows the widget's Storybook stories: every scene in its
  stories file, and the story that renders each slot's scaffolding. Islands
  mount gonogo's Storybook harness from `packages/storybook` in the gonogo
  checkout, or `GONOGO_STORYBOOK`, whose stories are generated with
  `pnpm --filter @ksp-gonogo/storybook generate`. Storybook's UI is never
  loaded. Without a checkout the site still builds and each island says it
  has nothing to mount. `npm run check:demos` saves a screenshot of each
  render, which the page shows above its code before any script runs

To change a generated page, change the doc comment it comes from, its example
file, or its module. Every page under `docs/reference/` is generated: the build
fails on a hand-written page there, and on a generated page that is committed
or edited by hand (`npm run check:pages`).

### Adding a page

- **A sdk, ui-kit or uplink-tools category**: tag its symbols
  `@category <Name>` in gonogo, repack, and add a `category` module naming the
  package, the category and its `lead` symbol. The page opens with what the
  category is for: a `@categoryDescription <Name>` tag on one of its symbols
  (or in the entry's module comment), and for a contract category a
  `<categoryDescription>` element beside one type's `<category>`. A guide that places a
  category's symbols through hand prose is a `guide` module over a source in
  `reference/guides/`
- **A widget**: a `widget` module naming the widget by id, the fixture scene
  it renders on, one example file per slot under `reference/examples/<widget>/`,
  and its `stories`. The page's header (name, description, Topics, actions,
  slots, default size and the rest) is the widget's record in uplink-tools'
  `widgets.json`, so the module states none of it; generation fails if it
  does, and `npm run check:pages` fails on a widget page whose header is not
  its packed record's. The generator lists any slot with no scaffolding story
- **Contract types**: a `contract` module naming the C# types, with a compiled
  region (from `example/` or `reference/examples/mod/`) under any type that has one
- **A concept**: write it in gonogo, in a doc comment beside the code it
  explains, as a `@concept <Name>` tag whose first line is the name and the
  rest the text; repack, and add a `concept` module naming it under
  `reference/pages/reference/concepts/`. Generation fails on a concept no
  page shows and on a page whose concept no comment writes. Every symbol
  carrying the tag links to the page, and the first use of each term in the
  concept's name on any page links there too (`docs/.vitepress/conceptLinks.mts`),
  bar the terms `scripts/concept-terms.mjs` lists as ambiguous
- **A link from a reference entry to the Guide**: a `@guide <page>#<anchor>`
  tag in the symbol's doc comment (`@guide extensions#augments`). Generation
  fails when the Guide page does not exist, and `npm run check:links` when
  the anchor does not
- **An index page**: none to add. A section's index (`reference/client/`)
  lists every page in its section, and the Topic list every Topic, as soon as
  they are generated

Every generated reference page gets its sidebar entry from the generator
(`docs/.vitepress/sidebar.generated.json`), in its directory's group, named by
its module's `title` or, for a widget, its record, with the section's index
first. A new page needs no config edit.

`reference/pages.mjs` documents every field a module takes.

### Checking one page

```bash
npm run reference -- --no-install            # regenerate from the installed artifacts
npm run check:pages                          # generated or listed, never committed or edited
npx vitepress build docs
npm run check:rendered                       # no page left empty, every link and anchor lands
npm run check:links                          # every symbol reference linked
npm run check:demos -- --page widgets/crew   # the live examples on matching pages
```

`npm run check` compiles and tests every example, and `npm run build` runs
everything in the order CI does.

## What is compiled and what is quoted

- **Anything the reader writes** is transcluded compiled source
- **Signatures on reference pages** are generated from the packed packages'
  declarations by TypeDoc and xmldocmd, so they cannot drift from what they
  document

## Publishing

`docs/.vitepress/config.mts` sets `base: "/uplink-dev-docs/"`, which must match the
GitHub Pages path. Change it if the repository is named anything else, or set it
to `"/"` for a user or custom-domain site. Every internal link is root-relative,
so the base is the only place the path appears.

Pages must be set to deploy from GitHub Actions in the repository settings.

## Layout

```
docs/          the site
example/       the Guide's worked Uplink, and the source of every Guide snippet
reference/     the generated reference's page modules, examples and fixtures
scripts/       the doc gates, and the generated ui-kit export list they read
```
