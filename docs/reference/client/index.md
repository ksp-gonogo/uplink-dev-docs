# @ksp-gonogo/sitrep-sdk

```bash
npm install @ksp-gonogo/sitrep-sdk
```

The wire contract for the Gonogo mod's telemetry stream, generated from the mod's own C# types.

## What it is

| Export | Kind | Purpose |
| --- | --- | --- |
| `parseServerMessage` | function | Parse and validate an incoming frame |
| `ServerMessage`, `ClientMessage` | types | The two message unions |
| `StreamData`, `EventMsg`, `CommandResponse`, `ErrorMsg` | types | Server envelope members |
| `Subscribe`, `Unsubscribe`, `CommandRequest` | types | Client envelope members |
| `Meta` | type | The provenance block on every frame |
| `TopicId`, `TopicPayload`, `TopicPayloadMap`, `TOPIC_IDS`, `isTopicId` | types + values | The built-in Topics and their payloads |
| `Quality`, `Staleness`, `CommandErrorCode`, `GameMode`, … | enums | Wire enums, as real runtime enums |
| Payload interfaces | types | One per built-in Topic payload |
| `SDK_VERSION` | constant | Reports `"0.0.0"` in the `0.0.1` package. Do not depend on it. |

The generated half was generated once, and the mod's contract has moved since. `CommandErrorCode` is a string id on the wire and an integer enum of seven members here. Read [Known limits](/guide/limits) before relying on a generated type to be complete.

## What it is not

It does not open a socket, hold subscriptions, correlate requests, cache values, or provide React bindings. [The guide](/guide/client-stream) shows the client you write on top of it, which is about a hundred lines.

The package has a single entry point. Subpaths do not resolve.

## It needs a bundler

The published ESM uses extensionless relative imports, which Node will not resolve:

```
ERR_MODULE_NOT_FOUND: Cannot find module '.../dist/__generated__/contract'
```

Vite, webpack, esbuild and Rollup are unaffected. In Vitest, add the package to `server.deps.inline`.
