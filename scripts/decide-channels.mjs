/**
 * Decides which channels of the site a workflow run builds.
 *
 * A run on `main` builds both, because one Pages artifact holds the whole site
 * and a deploy of one channel alone would delete the other. A push elsewhere
 * builds only the root, as a check.
 *
 * `--stale` is for the nightly workflow: it prints `true` when a channel's
 * deployed `version.json` no longer matches what the registries say, so an
 * unchanged night dispatches no build.
 *
 *   REF=<ref> node scripts/decide-channels.mjs    prints a JSON array of channels
 *   node scripts/decide-channels.mjs --stale      prints true or false
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveChannel } from "./resolve-channel.mjs";

const SITE = "https://ksp-gonogo.github.io/uplink-dev-docs";
const LIVE = { latest: `${SITE}/version.json`, rc: `${SITE}/rc/version.json` };

/** The channels a run on `ref` builds. */
export function decide(ref) {
  return ref === "refs/heads/main" ? ["latest", "rc"] : ["latest"];
}

/** Whether a channel's deployed build differs from what the registries name now. */
export function isStale(resolved, live) {
  return !live || live.version !== resolved.version || live.commit !== resolved.commit;
}

async function liveVersion(channel) {
  try {
    const response = await fetch(LIVE[channel]);
    return response.ok ? await response.json() : undefined;
  } catch {
    return undefined;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--stale")) {
    let stale = false;
    for (const channel of ["latest", "rc"]) {
      stale ||= isStale(await resolveChannel(channel), await liveVersion(channel));
    }
    console.log(String(stale));
  } else {
    console.log(JSON.stringify(decide(process.env.REF ?? "")));
  }
}
