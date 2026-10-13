# Testing

Both halves of an Uplink test without the game: the client in a simulated browser, the plugin on .NET. This page covers what the scaffold sets up, how to feed a widget data, and what to run in CI.

## The client's setup

`client/src/test/setup.ts`, which `vitest.config.ts` runs before every test file:

<<< ../../example/client/src/test/setup.ts

So a test needs nothing of its own to render a widget:

- `installDomStubs` adds the browser features the simulated browser lacks and widgets use
- `installRealTestHost` installs the app's own host, so `useTelemetry`, `useCommand` and `registerComponent` behave as they do in the app. Without a host they throw
- `PerfBudget`'s `installTestGate` fails a test that pushes one of Gonogo's performance budgets over its limit, such as a widget subscribing in a loop. A budget is a ceiling on how often something may happen per second, such as how many times a widget may subscribe to a Topic; the failure names the budget, its limit and the rate the test reached, and the fix is the code that is doing the work too often
- `setQuantityLocale` fixes how numbers are written, so a test's expected text is the same on every machine

The scaffold's `package.json` installs everything these import, `@testing-library/jest-dom` included. [`render`](/reference/client/testing/rendering#render) and `screen` from `@ksp-gonogo/sitrep-sdk/testing` are Testing Library's, with the kit's theme mounted. `renderWidget` from `@ksp-gonogo/ui-kit/testing` renders a widget by its id inside the provider stack the dashboard puts around it, for a test of something the dashboard draws, such as a status badge on its panel.

## Feeding a widget

A widget rendered alone has no data, which is the waiting state, and worth a test of its own. To feed it, render it inside a stream fixture. From `client/src/Heartbeat/index.test.tsx`:

<<< ../../example/client/src/Heartbeat/index.test.tsx#reckoned

`setupStreamFixture` builds the app's telemetry pipeline over a transport the test feeds by hand. Render inside its `Provider`, then `emit` payloads in the form the plugin sends them, plain numbers included, with the game time each was true at. `pinnedUt` fixes the game time the operator's screen is at (1000000 when a fixture names none; a test calling `setupStreamFixture` states it itself). Wrap emits in `act` and end with `store.beginFrame()`, so React and the pipeline both settle before you assert.

`stopArriving` drops the link, so every reading the widget drew becomes [held](/reference/concepts/held). Further down the same file, with its own import so the block above stands alone:

<<< ../../example/client/src/Heartbeat/index.test.tsx#held

## What `Unit` draws

A test that reads a figure back reads what `Unit` drew, not the number the plugin sent. `Unit` picks the symbol, the precision and the step on the unit's ladder from the unit and the size of the value, so `12400` metres is `12.4` beside `km`, and a duration is steps of time: a `Units.Seconds` value of `95` is drawn as `1min 35s`, `45` as `45s`, `3600` as `1h`. A count is drawn bare (`7`), a moment (`Units.UniversalTime`) as a date and clock time, and every other unit with its own precision. [How each unit is drawn](/guide/topics#how-each-unit-is-drawn) lists them all, so assert the string in that table, not the raw number.

The figure sits in an element of its own, with the unit's symbol in a child element beside it (carrying a `data-unit` attribute, and a visually hidden word such as "kilometres"). So the number matches on its own and the symbol is checked by its attribute:

```tsx
expect(screen.getByText("12.4")).toBeVisible();
expect(screen.getByText("12.4").querySelector("[data-unit]")).toHaveAttribute("data-unit", "km");
// a duration has no symbol after it
expect(screen.getByText("1min 35s")).toBeVisible();
```

A figure that has stopped updating is drawn with its mark and a spoken caption, which the held test above covers; that caption is separate text and does not change what `getByText` finds for the number.

## Fixtures

`client/src/Heartbeat/__fixtures__/beating.json`:

<<< ../../example/client/src/Heartbeat/__fixtures__/beating.json

A fixture is a scene the render harness draws a widget in: `_scene` names the widget, its picture's `caption`, the modes to draw it in, and `hero`, and `_stream` says what is on the wire. `"hero": true` marks the fixtures whose pictures the generated page shows for that widget; `npm run docs` fails for a widget that has fixtures and none marked. `_meta.notes` is free text for the next person to read the file, and nothing reads it. The `min` mode draws the widget at its `minSize`, and exists only while `minSize` is smaller than `defaultSize`: make them equal and a fixture naming `min` fails with a message naming the fixture, saying the widget has no separate smallest size, so take `min` out of `modes` or give the widget a smaller `minSize`. `npm run render` draws every fixture to `client/renders/` in a real browser, and `npm run docs` draws them into the generated page, so a fixture is both a picture to look at and the page's illustration. Rendering needs Chromium, installed once with `npx playwright install chromium`.

`_stream` takes four fields:

| Field | Type | What it does |
| --- | --- | --- |
| `emits` | a list of `{ topic, payload, validAt? }` | replayed in order once the scene has subscribed; `validAt` is the game time each was sent, `pinnedUt` when it names none |
| `pinnedUt` | number, game seconds | the operator's view time; it defaults to `1000000` |
| `delaySeconds` | number, seconds | a one-way light time between the craft and the screen, so the scene shows modelled values beside received ones |
| `stopsArriving` | boolean | drops the link once every emit has landed, so every figure is drawn held |

The [`@ksp-gonogo/uplink-tools` README](https://www.npmjs.com/package/@ksp-gonogo/uplink-tools) has the full list of what a fixture may hold.

## The plugin's tests

`mod-tests/` is an xunit project that compiles the plugin's own sources, so a test constructs the plugin class and calls it directly: its manifest, its sample function, its command handlers. On a test project the `KspGonogo.Sitrep.Contract` package also brings `Sitrep.Contract.TestSupport`, with fake hosts and checks of the rules a manifest must follow, among them `CommandRegistrationAssertion` (every handler and publisher the plugin registers is one its manifest declares), `UnitCoverageAssertion` (every field of the contract slice names its unit), `ReckonabilityAssertion` (a field the client has a reckoner for publishes what its model needs, [Writing a reckoner](/guide/reckoners)), `WirePayload`, a C# helper that serialises a payload the way the Gonogo mod writes it and `ClockedUplinkHost` (a host that records what the plugin publishes). The Reference does not cover these C# helpers; their doc comments are in the package. Run them with `dotnet test ../mod-tests` from `client/`.

A plugin that references KSP's or a mod's assemblies has code the test project cannot compile, since it has no KSP. Keep that code in a file of its own, and leave that file out in `mod-tests/GonogoExampleUplink.Tests.csproj`, beside the line that compiles the plugin's sources:

```xml
<Compile Include="..\mod\*.cs" />
<Compile Remove="..\mod\KspReads.cs" />
```

`KspReads.cs` stands for your own file's name.

A plugin that reaches the game or a mod only by reflection names no KSP type, so the test project compiles all of it and needs no such line ([Wrapping a mod](/guide/wrapping-a-mod#testing-without-the-mod)).

## In CI

From `client/`, every command an Uplink's CI needs, none of them needing the game or a browser:

```bash
npm ci
npm run codegen:check        # the generated types match the contract slice
npm run typecheck
npm run check               # the client's own rules, and its types under Node's resolution
npm test                     # the widgets, and the generated page
npx uplink-tools bake        # the plugin's generated files
dotnet test ../mod-tests
```

`new --workflows` writes these as a GitHub Actions workflow. In CI `bake` prints `Hash (none)`: no client bundle has been built there, so there is no hash to vouch for, and that is expected. `release` is what bakes the real one.

### In a sandbox that blocks local sockets

`dotnet test` binds a port on the local machine to talk to its test host, so a sandbox that blocks local network binding stops it at once, with a `SocketException` for permission denied, until local binding is allowed for the process. In the same kind of sandbox a plain `dotnet build` can appear to hang for minutes; `dotnet build -m:1 --disable-build-servers` avoids the build server's sockets. `uplink-tools release` has its own switch for this ([Releasing and installing](/guide/release#if-release-hangs-in-a-sandbox)).

## Checking the client

`npx uplink-tools check` reads the client with the TypeScript compiler and reports what is wrong with it, with the one command that heals each finding. It exits 0 when nothing is found, 1 when findings remain, and 2 when it could not run. `--fix` writes the files `check` owns and then verifies again, and is refused when `CI` is set. `--only` and `--skip` take a comma-separated list of groups, and `--json` prints the findings and nothing else.

A read `check` cannot name, such as a Topic chosen at runtime, takes a `// gonogo:reads <topic or family>` comment above the call, where a family is a pattern for a set of Topic ids with whole-segment `<name>` placeholders, such as one Topic per body. The groups are `declarations`, `page`, `manifest`, `bake`, `codegen`, `imports`, `plugin`, `actions` and `docs-prose`, one per part of the Uplink the rules read, and `docs-prose` has no rules yet so it is reported skipped. Three more groups start a process, so they run only when `--only` names them:

- `npx uplink-tools check --only loadable` imports, in a bare `node`, every entry point of the `@ksp-gonogo` packages the client depends on that gonogo publishes, the way anything outside a bundler would. A test run does not answer it, because the test runner inlines those packages and finds files Node refuses to. The kit's root barrel and the entry points that reach it cannot be imported by a bare Node today, so they are listed as exempt, and `check` warns when one starts to load
- `npx uplink-tools check --only nodenext` typechecks the client under Node's module resolution, from `tsconfig.nodenext.json`, which a bundler-only typecheck cannot see. `npm run check` names it
- `npx uplink-tools check --only minsize` draws every widget in a browser at the `minSize` it declares and fails for each one whose text is cut off, whose title is clipped or whose content is hidden with nothing to scroll. It needs Chromium (`npx playwright install chromium`) and exits 2 naming that command when there is none. It measures in pixels, so run it on the platform your CI uses

Each proves it can see before it reports: `loadable` tells a module that loads from one that throws, `nodenext` must see a type error it plants, and `minsize` draws a widget it planted with a heading that cannot fit and must see it clipped. A check that cannot see a fault it planted stops with `BLIND` and exit 2, rather than report nothing found.

The `manifest` group also reads the `mod` block of `uplink.json`, and that is the one rule that still runs for an Uplink with no client. An Uplink that wraps a mod names the version it was built against (`builtAgainst`) and a `tier`, `"ckan"` for a mod CKAN lists or `"manual"` for one a player installs by hand; one that wraps nothing declares `"mod": null`.

On a new Uplink `check` reports `bake/stale` until the first `npm run release`: the plugin carries no hash yet, because the bundle's hash is only known once the client has been built, and `release` bundles, bakes and compiles in that order. That finding is expected, and its fix is `release`. What `bake` writes (the three `*.g.cs` files in `mod/`) is never committed: the scaffold's `.gitignore` lists them, so a `check` run in CI follows a `release` step in the same job.

## Checking the pictures

`npm run docs:check` regenerates the page and its pictures in memory and fails when the committed ones differ, so it needs Chromium. As it draws each fixture it also checks the picture can be read, and prints a warning for a widget whose text is cut off or whose title is clipped at a size it draws. A warning does not fail the command; it says the widget needs a bigger tile or less text, so raise its `minSize` or give its `Panel` a `compactTitle`. The scaffold's widget draws none.

## When the page is out of date

`npm test` includes the page check, so after a change to a registration it fails until the page is regenerated. `npm run page` regenerates it by running only that check, so it writes the page even while another test is failing, and says which files it wrote. Then run `npm test` again.

Next: [Documenting your Uplink](/guide/documenting).
