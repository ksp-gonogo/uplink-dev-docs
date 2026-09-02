# Reference

Three surfaces, and nothing else is available to an Uplink.

## [Mod API](/reference/mod/)

`Sitrep.Contract.dll`, shipped in `GameData/Gonogo/Plugins/`. The interface you implement, the host you are handed, and the declarations you fill in.

## [Client SDK](/reference/client/)

`@ksp-gonogo/sitrep-sdk`. The wire contract: message envelopes, the Topic-to-payload map, and one parser.

## [ui-kit](/reference/ui-kit/)

`@ksp-gonogo/ui-kit`. Twenty presentational primitives, a theme contract, and a number formatter.

---

Signatures on these pages are exercised by compiled files in the template, so a signature that has drifted fails the build rather than reading correctly and being wrong.
