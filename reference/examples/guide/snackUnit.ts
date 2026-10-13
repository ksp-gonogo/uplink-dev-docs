import { registerUnit } from "@ksp-gonogo/sitrep-sdk";

declare module "@ksp-gonogo/sitrep-sdk" {
  interface UnitDeclarations {
    "snacks:crate": { kind: "snacks"; dim: { readonly snack: 1 }; ratio: 1 };
  }
}

registerUnit({
  symbol: "snacks:crate",
  kind: "snacks",
  dimension: { snack: 1 },
  ratio: 1,
});
