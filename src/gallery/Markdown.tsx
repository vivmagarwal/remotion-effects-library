import React from 'react';

const inline = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

/** Just enough Markdown for the effect briefs: headings, lists, fenced code, paragraphs. */
export const Markdown: React.FC<{source: string}> = ({source}) => {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let fence: string[] | null = null;

  const flushList = () => {
    if (!list.length) return;
    const items = list;
    list = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {items.map((li, i) => (
          <li key={i} dangerouslySetInnerHTML={{__html: inline(li)}} />
        ))}
      </ul>,
    );
  };

  for (const line of source.split('\n')) {
    if (line.trim().startsWith('```')) {
      if (fence) {
        const body = fence.join('\n');
        fence = null;
        blocks.push(
          <pre key={`pre-${blocks.length}`}>
            <code>{body}</code>
          </pre>,
        );
      } else {
        flushList();
        fence = [];
      }
      continue;
    }
    if (fence) {
      fence.push(line);
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }
    flushList();

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const Tag = (heading[1].length <= 2 ? 'h2' : 'h3') as 'h2' | 'h3';
      blocks.push(
        <Tag key={blocks.length} dangerouslySetInnerHTML={{__html: inline(heading[2])}} />,
      );
      continue;
    }

    if (line.trim()) {
      blocks.push(<p key={blocks.length} dangerouslySetInnerHTML={{__html: inline(line)}} />);
    }
  }

  flushList();
  if (fence) {
    blocks.push(
      <pre key="tail">
        <code>{fence.join('\n')}</code>
      </pre>,
    );
  }

  return <>{blocks}</>;
};
