import type { MarkdownRenderer } from "vitepress";
import { isSelf, loadMemberAnchors, loadSymbolIndex, memberTarget, pageOfFile, placeOf, symbolOf } from "../../scripts/symbol-links.mjs";

/**
 * Links every inline code span that names a documented symbol to that
 * symbol's reference entry, on every page, hand-written or generated.
 *
 * Left alone: a span already inside a link, one in a heading, where a link
 * would fight the heading's own anchor, one that would link to the top of the
 * page it is on, and one naming a symbol on the ambiguous list
 * (`scripts/ambiguous-symbols.mjs`), which links only where a link is written. Code blocks are never inline spans, so they are never
 * touched. On a C# page a name the contract shares with the sdk links to the C# type.
 *
 * A link to the top of the page it is on goes nowhere, so it is dropped.
 *
 * A member (`CommandResult.detail`) links to its row, an `uplink-tools`
 * command to its section of the command line page, and `uplink.json` to its
 * Guide page.
 */
export function symbolLinks(md: MarkdownRenderer): void {
  md.core.ruler.push("symbol-links", (state) => {
    const page = pageOfFile(String(state.env?.relativePath ?? ""));
    const index = loadSymbolIndex(page) as Record<string, string>;
    const anchors = loadMemberAnchors() as Record<string, string[]>;
    state.tokens.forEach((block, i) => {
      if (block.type !== "inline" || !block.children) return;
      if (state.tokens[i - 1]?.type === "heading_open") return;
      let inLink = 0;
      // Whether each open link was dropped, as one to the top of the page it is on.
      const dropped: boolean[] = [];
      const children = [];
      for (const token of block.children) {
        if (token.type === "link_open") {
          const self = isSelf(String(token.attrGet("href") ?? "#"), page);
          dropped.push(self);
          inLink++;
          if (self) continue;
        }
        if (token.type === "link_close") {
          inLink--;
          if (dropped.pop()) continue;
        }
        const name = token.type === "code_inline" && inLink === 0 ? symbolOf(token.content, index) : null;
        const href = name
          ? index[name]
          : token.type === "code_inline" && inLink === 0
            ? (memberTarget(token.content, index, anchors) ?? placeOf(token.content))
            : null;
        if (!href || isSelf(href, page)) {
          children.push(token);
          continue;
        }
        const open = new state.Token("link_open", "a", 1);
        open.attrs = [["href", href]];
        children.push(open, token, new state.Token("link_close", "a", -1));
      }
      block.children = children;
    });
  });
}
