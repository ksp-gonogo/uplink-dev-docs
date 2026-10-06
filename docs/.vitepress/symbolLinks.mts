import type { MarkdownRenderer } from "vitepress";
import { isSelf, loadSymbolIndex, pageOfFile, symbolOf } from "../../scripts/symbol-links.mjs";

/**
 * Links every inline code span that names a documented symbol to that
 * symbol's reference entry, on every page, hand-written or generated.
 *
 * Left alone: a span already inside a link, one in a heading, where a link
 * would fight the heading's own anchor, and one that would link to the top of
 * the page it is on. Code blocks are never inline spans, so they are never
 * touched.
 */
export function symbolLinks(md: MarkdownRenderer): void {
  md.core.ruler.push("symbol-links", (state) => {
    const index = loadSymbolIndex() as Record<string, string>;
    const page = pageOfFile(String(state.env?.relativePath ?? ""));
    state.tokens.forEach((block, i) => {
      if (block.type !== "inline" || !block.children) return;
      if (state.tokens[i - 1]?.type === "heading_open") return;
      let inLink = 0;
      const children = [];
      for (const token of block.children) {
        if (token.type === "link_open") inLink++;
        if (token.type === "link_close") inLink--;
        const name = token.type === "code_inline" && inLink === 0 ? symbolOf(token.content, index) : null;
        if (!name || isSelf(index[name], page)) {
          children.push(token);
          continue;
        }
        const open = new state.Token("link_open", "a", 1);
        open.attrs = [["href", index[name]]];
        children.push(open, token, new state.Token("link_close", "a", -1));
      }
      block.children = children;
    });
  });
}
