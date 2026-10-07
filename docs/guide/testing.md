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

A fixture is a scene the render harness draws a widget in: `_scene` names the widget, its picture's `caption` and the modes to draw it in, and `_stream` says what is on the wire. `npm run render` draws every fixture to `client/renders/` in a real browser, and `npm run docs` draws them into the generated page, so a fixture is both a picture to look at and the page's illustration. Rendering needs Chromium, installed once with `npx playwright install chromium`.

Beside `pinnedUt` and `emits`, `_stream` takes `delaySeconds`, which stages a signal delay so the scene shows modelled values beside received ones, and `stopsArriving`, which draws every figure held. The [`@ksp-gonogo/uplink-tools` README](https://www.npmjs.com/package/@ksp-gonogo/uplink-tools) documents each field.

## The plugin's tests

`mod-tests/` is an xunit project that compiles the plugin's own sources, so a test constructs the plugin class and calls it directly: its manifest, its sample function, its command handlers. On a test project the `KspGonogo.Sitrep.Contract` package also brings `Sitrep.Contract.TestSupport`, with fake hosts and checks of the rules a manifest must follow. Run them with `dotnet test ../mod-tests` from `client/`.

Code that names a KSP type cannot be compiled into the test project, which has no KSP assemblies. Keep it in a file of its own, and leave that file out in `mod-tests/GonogoExampleUplink.Tests.csproj`, beside the line that compiles the plugin's sources:

```xml
<Compile Include="..\mod\*.cs" />
<Compile Remove="..\mod\KspReads.cs" />
```

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

`new --workflows` writes these as a GitHub Actions workflow. `npm run docs:check` also compares the pictures, and needs Chromium.

Next: [Documenting your Uplink](/guide/documenting).
