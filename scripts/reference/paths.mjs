import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
/** Packed stand-ins for published packages. Not committed. */
export const ARTIFACTS = resolve(ROOT, "artifacts");
/** Where the artifacts are installed, as an Uplink author would install them. Not committed. */
export const INSTALL = resolve(ROOT, ".reference");
export const DOCS = resolve(ROOT, "docs");
/** Each generated page's hash as the generator wrote it, by path from the repo root. Not committed. */
export const GENERATED_HASHES = resolve(INSTALL, "generated.json");

export const hashOf = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

/** The broken examples `check:demos` must catch, by id, and the file that exports them. */
export const PLANTED_DEMOS = { "plant--throws": "ThrowsOnRender", "plant--empty": "RendersNothing" };
export const PLANTED_DEMO_FILE = "reference/plants/demos.tsx";

/**
 * The Storybook package whose harness and stories the live examples mount, or
 * null when there is none: `GONOGO_STORYBOOK`, else `packages/storybook` in
 * the gonogo checkout (`GONOGO_REPO`, else one beside this repo). Its stories
 * are generated: run `pnpm --filter @ksp-gonogo/storybook generate` there.
 */
export function storybookRoot() {
  const named = process.env.GONOGO_STORYBOOK;
  if (named === "off") return null;
  const repo = process.env.GONOGO_REPO && process.env.GONOGO_REPO !== "off" ? process.env.GONOGO_REPO : resolve(ROOT, "../gonogo");
  const root = named ?? resolve(repo, "packages/storybook");
  return existsSync(resolve(root, ".storybook/preview.ts")) ? root : null;
}
