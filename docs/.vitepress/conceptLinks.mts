import type { MarkdownRenderer } from "vitepress";
import { loadConceptTerms } from "../../scripts/concept-terms.mjs";
import { pageOf, pageOfFile } from "../../scripts/symbol-links.mjs";

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Links the first use of each concept term on a page to its concept page, so a
 * reader meeting "held" or "signal delay" can find what it means.
 *
 * Only plain prose is read: never code, a heading, text already inside a link,
 * or the concept's own page. A term matches whole words, in any case, with or
 * without a plural "s".
 */
export function conceptLinks(md: MarkdownRenderer): void {
  md.core.ruler.push("concept-links", (state) => {
    const terms = loadConceptTerms() as Record<string, string>;
    const names = Object.keys(terms).sort((a, b) => b.length - a.length);
    if (names.length === 0) return;
    const page = pageOfFile(String(state.env?.relativePath ?? ""));
    const pattern = new RegExp(`\\b(${names.map(escape).join("|")})s?\\b`, "i");
    const linked = new Set<string>();
    state.tokens.forEach((block, i) => {
      if (block.type !== "inline" || !block.children) return;
      if (state.tokens[i - 1]?.type === "heading_open") return;
      let inLink = 0;
      const children = [];
      for (const token of block.children) {
        if (token.type === "link_open") inLink++;
        if (token.type === "link_close") inLink--;
        const match = token.type === "text" && inLink === 0 ? pattern.exec(token.content) : null;
        const term = match?.[1].toLowerCase();
        if (!match || !term || linked.has(term) || pageOf(terms[term]) === page) {
          children.push(token);
          continue;
        }
        linked.add(term);
        const before = new state.Token("text", "", 0);
        before.content = token.content.slice(0, match.index);
        const word = new state.Token("text", "", 0);
        word.content = match[0];
        const after = new state.Token("text", "", 0);
        after.content = token.content.slice(match.index + match[0].length);
        const open = new state.Token("link_open", "a", 1);
        open.attrs = [["href", terms[term]], ["class", "concept-link"]];
        children.push(before, open, word, new state.Token("link_close", "a", -1), after);
      }
      block.children = children;
    });
  });
}
