# Testing

Both halves of an Uplink test without the game: the client in a simulated browser, the plugin on .NET. This page covers what the scaffold sets up, how to feed a widget data, and what to run in CI.

## The client's setup

`client/src/test/setup.ts`, which `vitest.config.ts` runs before every test file:

<<< ../../example/client/src/test/setup.ts

So a test needs nothing of its own to render a widget:

- `installDomStubs` adds the browser features the simulated browser lacks and widgets use
- `installRealTestHost` installs the app's own host, so `useTelemetry`, `useCommand` and `registerComponent` behave as they do in the app. Without a host they throw
- `PerfBudget`'s `installTestGate` fails a test that pushes one of Gonogo's performance budgets over its limit, such as a widget subscribing in a loop
- `setQuantityLocale` fixes how numbers are written, so a test's expected text is the same on every machine

The scaffold's `package.json` installs everything these import, `@testing-library/jest-dom` included. `render` and `screen` from `@ksp-gonogo/sitrep-sdk/testing` are Testing Library's, with the kit's theme mounted. `renderWidget` from `@ksp-gonogo/ui-kit/testing` renders a widget by its id inside the provider stack the dashboard puts around it, for a test of something the dashboard draws, such as a status badge on its panel.

## Feeding a widget

A widget rendered alone has no data, which is the waiting state, and worth a test of its own. To feed it, render it inside a stream fixture. From `client/src/Heartbeat/index.test.tsx`:

<<< ../../example/client/src/Heartbeat/index.test.tsx#reckoned

`setupStreamFixture` builds the app's telemetry pipeline over a transport the test feeds by hand. Render inside its `Provider`, then `emit` payloads in the form the plugin sends them, plain numbers included, with the game time each was true at. `pinnedUt` fixes the operator's clock. Wrap emits in `act` and end with `store.beginFrame()`, so React and the pipeline both settle before you assert.

`stopArriving` drops the link, so every reading the widget drew becomes held:

<<< ../../example/client/src/Heartbeat/index.test.tsx#held

## Fixtures

`client/src/Heartbeat/__fixtures__/beating.json`:

<<< ../../example/client/src/Heartbeat/__fixtures__/beating.json

A fixture is a scene the render harness draws a widget in: `_scene` names the widget, its picture's `caption` and the modes to draw it in, and `_stream` says what is on the wire. The `min` mode draws the widget at its `minSize`, and exists only while `minSize` is smaller than `defaultSize`: make them equal and a fixture naming `min` fails every test, so take it out of `modes`. `npm run render` draws every fixture to `client/renders/` in a real browser, and `npm run docs` draws them into the generated page, so a fixture is both a picture to look at and the page's illustration. Rendering needs Chromium, installed once with `npx playwright install chromium`.

Beside `pinnedUt` and `emits`, `_stream` takes `delaySeconds`, which stages a signal delay so the scene shows modelled values beside received ones, and `stopsArriving`, which draws every figure held. The [`@ksp-gonogo/uplink-tools` README](https://www.npmjs.com/package/@ksp-gonogo/uplink-tools) documents each field.

## The plugin's tests

`mod-tests/` is an xunit project that compiles the plugin's own sources, so a test constructs the plugin class and calls it directly: its manifest, its sample function, its command handlers. On a test project the `KspGonogo.Sitrep.Contract` package also brings `Sitrep.Contract.TestSupport`, with fake hosts and checks of the rules a manifest must follow. Run them with `dotnet test ../mod-tests` from `client/`.

A plugin that references KSP's or a mod's assemblies has code the test project cannot compile, since it has no KSP. Keep that code in a file of its own, and leave that file out in `mod-tests/GonogoExampleUplink.Tests.csproj`, beside the line that compiles the plugin's sources:

```xml
<Compile Include="..\mod\*.cs" />
<Compile Remove="..\mod\KspReads.cs" />
```

A plugin that reaches the game or a mod only by reflection names no KSP type, so the test project compiles all of it and needs no such line ([Wrapping a mod](/guide/wrapping-a-mod#testing-without-the-mod)).

## In CI

From `client/`, every command an Uplink's CI needs, none of them needing the game or a browser:

```bash
npm ci
npm run codegen:check        # the generated types match the contract slice
npm run typecheck
npm test                     # the widgets, and the generated page
npx uplink-tools bake        # the plugin's generated files
dotnet test ../mod-tests
```

`new --workflows` writes these as a GitHub Actions workflow.

## Checking the pictures

`npm run docs:check` regenerates the page and its pictures in memory and fails when the committed ones differ, so it needs Chromium. As it draws each fixture it also checks the picture can be read, and prints a warning for a widget whose text is cut off or whose title is clipped at a size it draws. A warning does not fail the command; it says the widget needs a bigger tile or less text, so raise its `minSize` or give its `Panel` a `compactTitle`. The scaffold's widget draws none.

## When the page is out of date

`npm test` includes the page check, so after a change to a registration it fails until the page is regenerated. `npm run page` regenerates it by running the tests, and refuses while they fail, including that one. Run `npm run docs` instead, which writes the page and the pictures without running the tests, then `npm test` again.

Next: [Documenting your Uplink](/guide/documenting).
