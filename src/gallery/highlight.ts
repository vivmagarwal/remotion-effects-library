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

    if (comment) out += `<span class="c">${esc(text)}</span>`;
    else if (str) out += `<span class="s">${esc(text)}</span>`;
    else if (num) out += `<span class="n">${text}</span>`;
    else if (word && KEYWORDS.has(word)) out += `<span class="k">${word}</span>`;
    else out += esc(text);
  }

  return out + esc(code.slice(last));
};
