const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KEYWORDS = new Set([
  'import', 'from', 'export', 'const', 'let', 'var', 'return', 'type', 'as',
  'default', 'function', 'if', 'else', 'for', 'of', 'in', 'new', 'await',
  'async', 'interface', 'readonly', 'extends', 'null', 'undefined', 'true', 'false',
]);

/**
 * Deliberately small TSX highlighter — one pass, so a keyword or number inside a
 * string or comment is never mis-coloured. Order matters: comments and strings
 * are matched before identifiers.
 *
 * It emits CLASS NAMES ONLY, never a colour: `styles.css` resolves
 * `.tok-*` to `--code-*` tokens so one HTML string serves both themes. The
 * classes used to be single letters (`.k .s .c .n`) which collided by name with
 * the `.n` count badge on the filter chips — they are prefixed now and the CSS
 * is scoped to `.code-block`.
 *
 * Two extra classes beyond the original four: `tok-fn` (identifier immediately
 * before a `(`) and `tok-type` (PascalCase — component and type names, roughly a
 * third of a Remotion file). A keyword-only highlighter looks flat on a light
 * ground where hue separation is weaker; these two buy most of the legibility of
 * a real grammar for a handful of lines.
 */
const TOKEN =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

export const highlight = (code: string): string => {
  let out = '';
  let last = 0;

  for (const m of code.matchAll(TOKEN)) {
    const [text, comment, str, num, word] = m;
    out += esc(code.slice(last, m.index));
    last = m.index + text.length;

    if (comment) out += `<span class="tok-com">${esc(text)}</span>`;
    else if (str) out += `<span class="tok-str">${esc(text)}</span>`;
    else if (num) out += `<span class="tok-num">${text}</span>`;
    else if (word && KEYWORDS.has(word)) out += `<span class="tok-key">${word}</span>`;
    // A `(` straight after the identifier means it is being called — the same
    // test a real grammar uses, and it costs one lookahead over the source.
    else if (word && code[last] === '(') out += `<span class="tok-fn">${word}</span>`;
    else if (word && /^[A-Z]/.test(word)) out += `<span class="tok-type">${word}</span>`;
    else out += esc(text);
  }

  return out + esc(code.slice(last));
};
