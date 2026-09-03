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

This repository depends on **published packages only**:
`@ksp-gonogo/sitrep-sdk` and `@ksp-gonogo/ui-kit` from npm, plus react,
styled-components and third-party packages. No workspace links, no `file:`
dependencies, no path into another checkout.

That is what makes a compiling snippet mean something. If a page cannot be
written without reaching past the published surface, the finding is that the
published surface is insufficient, and it belongs in `docs/guide/limits.md`
rather than being worked around.

## How snippets are checked

Pages never contain hand-copied code that is meant to compile. Every such
snippet is transcluded from a real source file under `template/`, using
VitePress's `<<< path#region` include.

`npm run check` runs four gates:

| Gate | Checks |
| --- | --- |
| `tsc -p template/client/tsconfig.json` | Every client snippet typechecks against the installed published packages |
| `dotnet build template/mod/ExampleUplink` | Every mod snippet compiles against `Sitrep.Contract.dll` |
| include scan | Every `<<<` in `docs/` resolves to a real file, and to a real `#region` when one is named |
| ui-kit page coverage | Every ui-kit COMPONENT has a reference page, every reference page is about something the kit exports, and the sidebar reaches all of them |

The include scan exists because VitePress renders a missing include as an error
block inside the page instead of failing the build, so a broken include would
ship looking like content.

The page-coverage gate (`scripts/check-ui-kit-pages.mjs`) is not one page per
export: a component is an export TypeScript will accept in one of the two
shapes React gives a component, and a page covers the whole MODULE a component
is exported from, which is why `PanelTitle` and `ScrollArea` live on `Panel`'s
page. Types, helper functions and the theme object are therefore not asked for
a page, and may still have one. The script's own header carries the reasoning,
the two rules that look right and are not, and what each kind of failure means.

`vitepress build` adds a fourth: it fails on a dead internal link. It does **not**
check heading anchors, so a wrong `#fragment` still builds. Check those by hand.

The mod gate needs `Sitrep.Contract.dll`, which is distributed in a KSP install
rather than on a package registry, so it is skipped unless you point at one:

```bash
SITREP_CONTRACT_DLL="/path/to/GameData/Gonogo/Plugins/Sitrep.Contract.dll" npm run check
```

It is therefore skipped in CI. Run it locally before changing anything under
`template/mod/`.

## What is compiled and what is quoted

- **Anything the reader writes** is transcluded compiled source.
- **Signatures on reference pages** are quoted declarations of published API.
  They cannot be transcluded, since this repository does not declare them.
  `template/mod/ExampleUplink/HostSurface.cs` and
  `template/client/src/sdkSurface.ts` exist to close that gap: they call every
  member the reference documents, so a signature that has drifted fails the
  build rather than reading correctly and being wrong.

## Publishing

`docs/.vitepress/config.mts` sets `base: "/uplink-dev-docs/"`, which must match the
GitHub Pages path. Change it if the repository is named anything else, or set it
to `"/"` for a user or custom-domain site. Every internal link is root-relative,
so the base is the only place the path appears.

Pages must be set to deploy from GitHub Actions in the repository settings.

## Layout

```
docs/          the site
template/      the starter an author copies, and the source of every snippet
scripts/       the snippet gate
```
