/**
 * What a pasted link to an Uplink's folder resolves to: the folder's base URL,
 * served with CORS headers so a browser can read it, and where its files sit
 * under that base.
 */
export interface UplinkLink {
  /** The folder as the user pasted it, normalised, and the key it is saved under. */
  base: string;
  /** A short label for the list: owner/repo plus the folder, or the host. */
  label: string;
}

const JSDELIVR = "https://cdn.jsdelivr.net";

/** The file names an Uplink's folder can end in when pasted, which are not part of the folder. */
const TRAILING_FILE = /\/(?:[^/]+\.client\.js|gonogo-uplink\.json|spec\.json|README\.md)$/;

function trimSlashes(path: string): string {
  return path.replace(/\/+$/, "");
}

/**
 * Turns a pasted link into the folder's base URL, or says why it cannot.
 *
 * Accepts a GitHub folder link (`https://github.com/<owner>/<repo>/tree/<ref>/<path>`),
 * a jsDelivr link (`https://cdn.jsdelivr.net/gh/<owner>/<repo>@<ref>/<path>`),
 * a raw.githubusercontent.com link, and the URL of a released bundle or its
 * sidecar. Nothing else: the viewer fetches the folder from the browser, and
 * only these hosts answer with CORS headers.
 */
export function resolveUplinkLink(input: string): UplinkLink | { error: string } {
  const text = input.trim();
  if (!URL.canParse(text)) return { error: "That is not a link. Paste the URL of an Uplink's folder." };
  const url = new URL(text);
  if (url.protocol !== "https:") return { error: "Only https links are read." };
  const path = trimSlashes(url.pathname).replace(TRAILING_FILE, "");

  if (url.host === "github.com") {
    const match = /^\/([^/]+)\/([^/]+)\/(?:tree|blob)\/([^/]+)(?:\/(.*))?$/.exec(path);
    if (!match) {
      return { error: "A GitHub link has to name a folder: https://github.com/<owner>/<repo>/tree/<ref>/<folder>." };
    }
    const [, owner, repo, ref, folder = ""] = match;
    return fromParts(owner, repo, ref, folder);
  }
  if (url.host === "cdn.jsdelivr.net") {
    const match = /^\/gh\/([^/]+)\/([^/@]+)@([^/]+)(?:\/(.*))?$/.exec(path);
    if (!match) {
      return { error: "A jsDelivr link has to name a ref: https://cdn.jsdelivr.net/gh/<owner>/<repo>@<ref>/<folder>." };
    }
    const [, owner, repo, ref, folder = ""] = match;
    return fromParts(owner, repo, ref, folder);
  }
  if (url.host === "raw.githubusercontent.com") {
    const match = /^\/([^/]+)\/([^/]+)\/([^/]+)(?:\/(.*))?$/.exec(path);
    if (!match) return { error: "A raw GitHub link has to name a folder." };
    const [, owner, repo, ref, folder = ""] = match;
    return fromParts(owner, repo, ref, folder);
  }
  return { error: "Only github.com, cdn.jsdelivr.net and raw.githubusercontent.com links are read." };
}

function fromParts(owner: string, repo: string, ref: string, folder: string): UplinkLink {
  const tail = folder ? `/${trimSlashes(folder)}` : "";
  return {
    base: `${JSDELIVR}/gh/${owner}/${repo}@${ref}${tail}`,
    label: `${owner}/${repo}${tail} @ ${ref}`,
  };
}

/**
 * Every place an Uplink's spec sheet can sit under its folder: at the root of a
 * released version's folder, or under the client of a source folder.
 */
export function specCandidates(base: string): string[] {
  return [`${base}/spec.json`, `${base}/client/docs/spec.json`, `${base}/docs/spec.json`];
}

/** Every place its manifest can sit, in the same order. */
export function manifestCandidates(base: string): string[] {
  return [`${base}/gonogo-uplink.json`, `${base}/client/gonogo-uplink.json`];
}
