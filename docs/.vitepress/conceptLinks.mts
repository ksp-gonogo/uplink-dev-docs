import type { MarkdownRenderer } from "vitepress";
import { loadConceptTerms } from "../../scripts/concept-terms.mjs";
import { pageOf, pageOfFile } from "../../scripts/symbol-links.mjs";

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const capitalised = /^\p{Lu}/u;

/** Whether the match at `index` is a capitalised word with a capitalised word beside it. */
function inProperNoun(text: string, index: number, word: string): boolean {
  if (!capitalised.test(word)) return false;
  const before = /(\S+)\s+$/u.exec(text.slice(0, index))?.[1] ?? "";
  const after = /^\s+(\S+)/u.exec(text.slice(index + word.length))?.[1] ?? "";
  const sentenceStart = before === "" || /[.!?:]$/.test(before);
  return (!sentenceStart && capitalised.test(before)) || capitalised.test(after);
}

/**
 * Links the first use of each concept term on a page to its concept page, so a
 * reader meeting "held" or "signal delay" can find what it means.
 *
 * Only plain prose is read: never code (a code span or a generated `<code>`
 * cell), a heading, text already inside a link, or the concept's own page. A
 * term matches whole words, in any case, with or without a plural "s", except
 * inside a proper noun: a capitalised term beside another capitalised word, as
 * in "Kerbin Station I" or "the Tracking Station", names a thing rather than
 * the concept.
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
      let inCode = 0;
      const children = [];
      for (const token of block.children) {
        if (token.type === "link_open") inLink++;
        if (token.type === "link_close") inLink--;
        if (token.type === "html_inline" && /^<code\b/i.test(token.content)) inCode++;
        if (token.type === "html_inline" && /^<\/code>/i.test(token.content)) inCode--;
        const match = token.type === "text" && inLink === 0 && inCode === 0 ? pattern.exec(token.content) : null;
        const term = match?.[1].toLowerCase();
        if (
          !match ||
          !term ||
          linked.has(term) ||
          pageOf(terms[term]) === page ||
          inProperNoun(token.content, match.index, match[0])
        ) {
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
