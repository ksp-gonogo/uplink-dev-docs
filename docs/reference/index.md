# Reference

Three surfaces, and nothing else is available to an Uplink.

## [Mod API](/reference/mod/)

`Sitrep.Contract.dll`, shipped in `GameData/Gonogo/Plugins/`. The interface you implement, the host you are handed, and the declarations you fill in.

## [Client SDK](/reference/client/)

`@ksp-gonogo/sitrep-sdk`. The wire contract: message envelopes, the Topic-to-payload map, and one parser.

## [ui-kit](/reference/ui-kit/)

`@ksp-gonogo/ui-kit`. Twenty presentational primitives, a theme contract, and a number formatter.

---

Signature blocks on these pages are transcribed declarations. What is compiled is every example: `template/mod/ExampleUplink/HostSurface.cs` calls every `IUplinkHost` member and fills every field of every declaration type, and `template/client/src/sdkSurface.ts` touches every SDK export the client pages document. A signature those files reach cannot drift without failing the build. The ui-kit prop interfaces are covered only where an example uses the prop.
