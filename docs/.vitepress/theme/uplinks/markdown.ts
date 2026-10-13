import MarkdownIt from "markdown-it";

/** One docs file of an Uplink: where it was read from and how it is titled in the sidebar. */
export interface UplinkDoc {
  /** Path from the Uplink's client folder, e.g. `README.md`. */
  path: string;
  title: string;
}

export interface RenderContext {
  /** The URL the file was read from, which its relative links and images resolve against. */
  fileUrl: string;
  /** The Uplink's client folder URL. */
  root: string;
  /** The docs files this Uplink is known to carry, for links between them. */
  docs: readonly UplinkDoc[];
  /** The address of one of those docs files on this site. */
  hrefFor(path: string): string;
}

/*
 * Raw HTML is off: markdown-it then escapes it, and its link validator refuses
 * javascript:, vbscript: and file: targets. Both are what makes text from a
 * third party safe to hand to v-html.
 */
const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

type Token = ReturnType<typeof md.parse>[number];

/** Drops HTML comments outside code fences: the generated README opens with one, which would print as text. */
export function withoutHtmlComments(text: string): string {
  let fenced = false;
  const out: string[] = [];
  let inComment = false;
  for (const line of text.split("\n")) {
    if (!inComment && /^\s{0,3}(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) {
      out.push(line);
      continue;
    }
    let rest = line;
    let kept = "";
    while (rest.length > 0) {
      if (inComment) {
        const end = rest.indexOf("-->");
        if (end < 0) {
          rest = "";
        } else {
          inComment = false;
          rest = rest.slice(end + 3);
        }
      } else {
        const start = rest.indexOf("<!--");
        if (start < 0) {
          kept += rest;
          rest = "";
        } else {
          kept += rest.slice(0, start);
          inComment = true;
          rest = rest.slice(start + 4);
        }
      }
    }
    if (kept.trim() !== "" || line.trim() === "") out.push(kept);
  }
  return out.join("\n");
}

function resolveWeb(target: string, fileUrl: string): URL | null {
  try {
    const url = new URL(target, fileUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

/** The path of `url` under `root`, or null when it is somewhere else. */
function underRoot(url: URL, root: string): string | null {
  const prefix = `${root}/`;
  const href = url.origin + url.pathname;
  return href.startsWith(prefix) ? decodeURI(href.slice(prefix.length)) : null;
}

function setAttr(token: Token, name: string, value: string | null): void {
  const at = token.attrIndex(name);
  if (value === null) {
    if (at >= 0) token.attrs?.splice(at, 1);
  } else if (at >= 0) {
    (token.attrs as [string, string][])[at][1] = value;
  } else {
    token.attrPush([name, value]);
  }
}

function rewrite(tokens: Token[], context: RenderContext): void {
  for (const token of tokens) {
    if (token.type === "link_open") {
      const target = token.attrGet("href") ?? "";
      if (target.startsWith("#")) {
        // An anchor inside the file would replace this page's address, and nothing here gives headings ids.
        setAttr(token, "href", null);
        continue;
      }
      const url = resolveWeb(target, context.fileUrl);
      if (!url) {
        setAttr(token, "href", null);
        continue;
      }
      const path = underRoot(url, context.root);
      if (path !== null && context.docs.some((doc) => doc.path === path)) {
        setAttr(token, "href", context.hrefFor(path));
        continue;
      }
      setAttr(token, "href", url.href);
      setAttr(token, "target", "_blank");
      setAttr(token, "rel", "noopener noreferrer");
    } else if (token.type === "image") {
      const url = resolveWeb(token.attrGet("src") ?? "", context.fileUrl);
      setAttr(token, "src", url ? url.href : null);
      setAttr(token, "loading", "lazy");
      setAttr(token, "referrerpolicy", "no-referrer");
    }
    if (token.children) rewrite(token.children, context);
  }
}

/**
 * Renders one Markdown file from an Uplink's folder to HTML that is safe to
 * insert: raw HTML in it appears as text, relative links and images resolve
 * against the folder the file was read from, and a link to another of the
 * Uplink's docs files opens that page on this site.
 */
export function renderMarkdown(text: string, context: RenderContext): string {
  const tokens = md.parse(withoutHtmlComments(text), {});
  rewrite(tokens, context);
  return md.renderer.render(tokens, md.options, {});
}
