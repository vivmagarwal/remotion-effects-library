import React from 'react';

const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Only http(s) and in-page anchors survive — a brief is data, not markup we wrote. */
const safeHref = (raw: string) => {
  const url = raw.trim();
  return /^(https?:\/\/|#|\/)/i.test(url) ? url : null;
};

/**
 * Inline span handling. Code spans are lifted out first and put back last, so a
 * `*` or a `[` inside `` `code` `` is never read as emphasis or a link.
 */
const inline = (text: string): string => {
  const codes: string[] = [];
  let out = esc(text).replace(/`([^`]+)`/g, (_m, body: string) => {
    codes.push(body);
    return `\u0000${codes.length - 1}\u0000`;
  });

  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Single asterisks, but never the leftovers of a `**` pair.
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label: string, href: string) => {
      const url = safeHref(href);
      return url ? `<a href="${url}" target="_blank" rel="noreferrer">${label}</a>` : m;
    });

  return out.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => `<code>${codes[Number(i)]}</code>`);
};

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

const isDivider = (line: string) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes('-');

/**
 * Just enough Markdown for the effect briefs: headings, bullet AND ordered
 * lists, fenced code, tables, `code`, **bold**, *italics* and links.
 *
 * Measured across the shipped briefs before this was widened: 5 contained
 * tables (every row rendered as a paragraph of literal pipes), 13 used ordered
 * lists (rendered as loose paragraphs with their numbering lost) and 65 used
 * single-asterisk italics (rendered as literal asterisks).
 */
export const Markdown: React.FC<{source: string}> = ({source}) => {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;
  let table: string[][] | null = null;
  let fence: string[] | null = null;
  let para: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    const items = list;
    const Tag = ordered ? 'ol' : 'ul';
    list = [];
    blocks.push(
      <Tag key={`list-${blocks.length}`}>
        {items.map((li, i) => (
          <li key={i} dangerouslySetInnerHTML={{__html: inline(li)}} />
        ))}
      </Tag>,
    );
  };

  const flushTable = () => {
    if (!table || !table.length) {
      table = null;
      return;
    }
    const [head, ...rows] = table;
    table = null;
    blocks.push(
      <div className="tablewrap" key={`table-${blocks.length}`}>
        <table>
          <thead>
            <tr>
              {head.map((c, i) => (
                <th key={i} dangerouslySetInnerHTML={{__html: inline(c)}} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} dangerouslySetInnerHTML={{__html: inline(c)}} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
  };

  /**
   * Briefs are hard-wrapped at ~90 columns, so a paragraph arrives as five or
   * six lines. Rendering one <p> per line chopped the prose into fragments and
   * broke any `inline code` that straddled a line break; consecutive prose lines
   * are joined into one paragraph instead.
   */
  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(' ');
    para = [];
    blocks.push(<p key={blocks.length} dangerouslySetInnerHTML={{__html: inline(text)}} />);
  };

  const flushAll = () => {
    flushPara();
    flushList();
    flushTable();
  };

  for (const line of source.split('\n')) {
    if (line.trim().startsWith('```')) {
      if (fence) {
        const body = fence.join('\n');
        fence = null;
        blocks.push(
          <pre className="code-block wrap" key={`pre-${blocks.length}`}>
            <code>{body}</code>
          </pre>,
        );
      } else {
        flushAll();
        fence = [];
      }
      continue;
    }
    if (fence) {
      fence.push(line);
      continue;
    }

    // Tables: a `|`-delimited row, and (for the header) a `---` divider under it.
    if (/^\s*\|.*\|\s*$/.test(line)) {
      if (isDivider(line)) continue;
      flushPara();
      flushList();
      (table ??= []).push(splitRow(line));
      continue;
    }
    flushTable();

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const wantOrdered = Boolean(numbered);
      if (list.length && ordered !== wantOrdered) flushList();
      ordered = wantOrdered;
      list.push((bullet ?? numbered)![1]);
      continue;
    }
    flushList();

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushPara();
      const Tag = (heading[1].length <= 2 ? 'h2' : 'h3') as 'h2' | 'h3';
      blocks.push(
        <Tag key={blocks.length} dangerouslySetInnerHTML={{__html: inline(heading[2])}} />,
      );
      continue;
    }

    if (line.trim()) para.push(line.trim());
    else flushPara();
  }

  flushAll();
  if (fence) {
    blocks.push(
      <pre className="code-block wrap" key="tail">
        <code>{fence.join('\n')}</code>
      </pre>,
    );
  }

  return <>{blocks}</>;
};
