const installTarget = /@ksp-gonogo\/(?:uplink-tools|sitrep-sdk|ui-kit)(?=[\s`"']|$)/g;
const installLine = /\b(?:npx|npm install)\b/;

/**
 * What a channel's npm tag adds to an install line: nothing for `latest`, which
 * is what an unqualified install gets, and `@<tag>` otherwise.
 */
export function tagSuffix(npmTag) {
  return npmTag === "latest" ? "" : `@${npmTag}`;
}

/**
 * Adds the suffix after each published package name on an `npx` or `npm install`
 * line of the given code. A name that already carries a version is left alone.
 */
export function tagInstallLines(code, suffix) {
  if (!suffix) return code;
  return code
    .split("\n")
    .map((line) => (installLine.test(line) ? line.replace(installTarget, (name) => `${name}${suffix}`) : line))
    .join("\n");
}

/** A markdown-it plugin that tags the install lines in every code block and code span. */
export function channelTag(md, suffix) {
  md.core.ruler.push("channel_tag", (state) => {
    if (!suffix) return;
    const visit = (tokens) => {
      for (const token of tokens) {
        if (token.type === "fence" || token.type === "code_inline") {
          token.content = tagInstallLines(token.content, suffix);
        }
        if (token.children) visit(token.children);
      }
    };
    visit(state.tokens);
  });
}
