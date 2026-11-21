/**
 * Works out what a channel of the site is built from, out of the registries,
 * and writes it into `reference/artifacts.json`.
 *
 *   latest  the root of the site: npm's `latest`, the gonogo commit it was cut from
 *   rc      /rc/: npm's `rc`, likewise
 *
 * The three npm packages and the NuGet package are published at one version, so
 * a tag whose packages disagree, or whose NuGet package is not listed, is a set
 * that is still being published and is refused rather than built. The commit is
 * the `gitHead` the packages record. A plain release published before that
 * existed falls back to its `v<version>` tag; a candidate has no tag, so one
 * without `gitHead` is refused.
 *
 *   node scripts/resolve-channel.mjs <latest|rc> [--write]
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGES = ["@ksp-gonogo/sitrep-sdk", "@ksp-gonogo/ui-kit", "@ksp-gonogo/uplink-tools"];
export const CHANNELS = {
  latest: { npmTag: "latest", name: "release" },
  rc: { npmTag: "rc", name: "release candidate" },
};

/** The one version the packages agree on, or an error naming how they differ. */
export function agreeingVersion(tags, channel) {
  const versions = new Set(Object.values(tags));
  if (versions.has("") || versions.size !== 1) {
    const lines = Object.entries(tags).map(([name, version]) => `${name}@${channel} is ${version || "not published"}`);
    throw new Error(`the packages do not agree on ${channel}:\n  ${lines.join("\n  ")}`);
  }
  return [...versions][0];
}

/** The gonogo commit a version was cut from: the packages' `gitHead`, else the release tag of a plain version. */
export function commitFor(version, gitHeads, tagCommit) {
  const heads = new Set(gitHeads.filter(Boolean));
  if (heads.size > 1) throw new Error(`the packages record different commits for ${version}: ${[...heads].join(", ")}`);
  if (heads.size === 1) return [...heads][0];
  if (/^\d+\.\d+\.\d+$/.test(version) && tagCommit) return tagCommit;
  throw new Error(`${version} records no commit (no gitHead, and no release tag to fall back to)`);
}

/** `artifacts.json` with the channel's published block and gonogo commit, everything else as it was. */
export function withChannel(manifest, channel, version, commit) {
  const { npmTag, name } = CHANNELS[channel];
  return { ...manifest, gonogo: commit, published: { version, npmTag, name } };
}

function npmView(spec, field) {
  const run = spawnSync("npm", ["view", spec, field], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(`npm view ${spec} ${field} failed: ${run.stderr.trim().split("\n").pop()}`);
  return run.stdout.trim();
}

async function nugetListed(version) {
  const response = await fetch("https://api.nuget.org/v3-flatcontainer/kspgonogo.sitrep.contract/index.json");
  if (!response.ok) throw new Error(`nuget.org index: ${response.status}`);
  return (await response.json()).versions.includes(version);
}

function releaseTagCommit(version) {
  const run = spawnSync(
    "git",
    ["ls-remote", "https://github.com/ksp-gonogo/gonogo.git", `refs/tags/v${version}`, `refs/tags/v${version}^{}`],
    { encoding: "utf8" },
  );
  if (run.status !== 0) return undefined;
  const rows = run.stdout.trim().split("\n").filter(Boolean).map((row) => row.split(/\s+/));
  return (rows.find(([, ref]) => ref.endsWith("^{}")) ?? rows[0])?.[0];
}

/** Everything a channel is built from, as the registries say right now. */
export async function resolveChannel(channel) {
  const { npmTag } = CHANNELS[channel];
  const tags = Object.fromEntries(PACKAGES.map((name) => [name, npmView(name, `dist-tags.${npmTag}`)]));
  const version = agreeingVersion(tags, npmTag);
  if (!(await nugetListed(version))) throw new Error(`KspGonogo.Sitrep.Contract ${version} is not listed on nuget.org yet`);
  const gitHeads = PACKAGES.map((name) => npmView(`${name}@${version}`, "gitHead"));
  const commit = commitFor(version, gitHeads, gitHeads.some(Boolean) ? undefined : releaseTagCommit(version));
  return { channel, version, commit };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [channel, ...flags] = process.argv.slice(2);
  if (!(channel in CHANNELS)) {
    console.error("usage: resolve-channel.mjs <latest|rc> [--write]");
    process.exit(2);
  }
  const resolved = await resolveChannel(channel);
  if (flags.includes("--write")) {
    const file = resolve(dirname(fileURLToPath(import.meta.url)), "../reference/artifacts.json");
    const next = withChannel(JSON.parse(readFileSync(file, "utf8")), channel, resolved.version, resolved.commit);
    writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
  }
  console.log(JSON.stringify(resolved));
}
