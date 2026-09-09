import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Player, Thumbnail} from '@remotion/player';
import {effects} from '../registry.generated';
import type {Category, EffectEntry} from '../types';
import {briefOf, composePrompt, sourceOf} from './sources';
import {CATEGORY_LABEL, CATEGORY_ORDER} from './categories';
import {Markdown} from './Markdown';
import {highlight} from './highlight';

/* ── search ──────────────────────────────────────────────────────────────── */

// Cached: with the library chips each computing a count, this runs
// effects × libraries times per keystroke otherwise.
const haystackCache = new WeakMap<EffectEntry, string>();

const buildHaystack = (e: EffectEntry) =>
  [
    e.meta.name,
    e.meta.tagline,
    e.meta.description,
    e.meta.category,
    ...e.meta.tags,
    ...e.meta.concepts,
    ...e.meta.packages,
  ]
    .join(' ')
    .toLowerCase();

const haystack = (e: EffectEntry) => {
  let h = haystackCache.get(e);
  if (h === undefined) {
    h = buildHaystack(e);
    haystackCache.set(e, h);
  }
  return h;
};

const matches = (e: EffectEntry, q: string) => {
  const h = haystack(e);
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => h.includes(term));
};

/** Library shortcuts. Each is a canned search — the haystack already indexes
 *  `packages`, so these need no separate filter state. */
const LIBRARIES: readonly {readonly label: string; readonly q: string}[] = [
  {label: 'three.js', q: 'three.js'},
  {label: 'D3', q: 'd3-'},
  {label: '@remotion/effects', q: '@remotion/effects'},
  {label: 'transitions', q: '@remotion/transitions'},
  {label: 'paths', q: '@remotion/paths'},
  {label: 'shapes', q: '@remotion/shapes'},
  {label: 'audio', q: '@remotion/media-utils'},
  {label: 'GLSL shaders', q: 'shader'},
  {label: 'SVG', q: 'svg'},
  {label: 'CSS', q: 'css'},
];

/**
 * Mounts a card's poster only while it is near the viewport.
 *
 * Every <Thumbnail> is a live Remotion render, and the three.js and
 * @remotion/effects entries each hold a WebGL context. Browsers cap those at
 * roughly 16, so mounting all 78 posters at once evicts the oldest contexts and
 * those thumbnails go blank. Observing in both directions keeps the number of
 * live canvases bounded by what is actually on screen.
 */
const useNearViewport = <T extends Element>(rootMargin = '700px') => {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {rootMargin});
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return [ref, near] as const;
};

/* ── card ────────────────────────────────────────────────────────────────── */

const PlayIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5v14l11-7z" />
  </svg>
);

const Card: React.FC<{
  entry: EffectEntry;
  onOpen: () => void;
  onCopy: (text: string, what: string) => void;
  copied: string | null;
}> = ({entry, onOpen, onCopy, copied}) => {
  const {meta, Component, file} = entry;
  const [playing, setPlaying] = useState(false);
  const [stageRef, near] = useNearViewport<HTMLDivElement>();
  // Every stage is 16:9 so the grid keeps its rhythm; portrait compositions are
  // pillarboxed inside it rather than stretching their card to twice the height.
  // The Player/Thumbnail always gets width: '100%' — it needs a definite width to
  // compute its own scale — so the letterboxing happens on this wrapper instead.
  const portrait = meta.width / meta.height < 16 / 9;
  const box: React.CSSProperties = {
    aspectRatio: `${meta.width} / ${meta.height}`,
    height: portrait ? '100%' : 'auto',
    width: portrait ? 'auto' : '100%',
  };

  return (
    <article className="card">
      <div
        ref={stageRef}
        className="stage"
        style={{aspectRatio: '16 / 9'}}
        onClick={() => setPlaying(true)}
        role="button"
        tabIndex={0}
        aria-label={`Play ${meta.name}`}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            setPlaying(true);
          }
        }}
      >
        {playing ? (
          <div style={box}>
            <Player
              component={Component}
              durationInFrames={meta.durationInFrames}
              compositionWidth={meta.width}
              compositionHeight={meta.height}
              fps={meta.fps}
              style={{width: '100%'}}
              autoPlay
              loop
              controls
              acknowledgeRemotionLicense
            />
          </div>
        ) : (
          <>
            <div style={box}>
              {near ? (
              <Thumbnail
                component={Component}
                durationInFrames={meta.durationInFrames}
                compositionWidth={meta.width}
                compositionHeight={meta.height}
                fps={meta.fps}
                frameToDisplay={meta.posterFrame ?? meta.checkFrame}
                style={{width: '100%'}}
              />
              ) : null}
            </div>
            <div className="playbtn">
              <i>
                <PlayIcon />
              </i>
            </div>
            <span className="ratio">
              {meta.width}×{meta.height}
            </span>
          </>
        )}
      </div>

      <div className="cardbody">
        <div className="cardhead">
          <h3>{meta.name}</h3>
          <span className="cat">{CATEGORY_LABEL[meta.category]}</span>
        </div>
        <p>{meta.tagline}</p>
        <div className="cardfoot">
          <button onClick={onOpen}>Details</button>
          <button
            className={copied === `${meta.id}:prompt` ? 'done' : ''}
            onClick={() => onCopy(composePrompt(meta, file), `${meta.id}:prompt`)}
          >
            {copied === `${meta.id}:prompt` ? 'Copied' : 'Copy prompt'}
          </button>
          <button
            className={copied === `${meta.id}:code` ? 'done' : ''}
            onClick={() => onCopy(sourceOf(file), `${meta.id}:code`)}
          >
            {copied === `${meta.id}:code` ? 'Copied' : 'Copy code'}
          </button>
        </div>
      </div>
    </article>
  );
};

/* ── detail sheet ────────────────────────────────────────────────────────── */

type Tab = 'prompt' | 'code' | 'about';

const Detail: React.FC<{
  entry: EffectEntry;
  onClose: () => void;
  onCopy: (text: string, what: string) => void;
  copied: string | null;
}> = ({entry, onClose, onCopy, copied}) => {
  const {meta, Component, file} = entry;
  const [tab, setTab] = useState<Tab>('prompt');
  const prompt = useMemo(() => composePrompt(meta, file), [meta, file]);
  const source = useMemo(() => sourceOf(file), [file]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const seconds = (meta.durationInFrames / meta.fps).toFixed(1);

  return (
    <div className="scrim" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="sheet">
        <header className="sheethead">
          <div>
            <h2>{meta.name}</h2>
            <p className="sub">{meta.description}</p>
          </div>
          <button className="x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="sheetplayer">
          <Player
            component={Component}
            durationInFrames={meta.durationInFrames}
            compositionWidth={meta.width}
            compositionHeight={meta.height}
            fps={meta.fps}
            style={{width: '100%', maxHeight: '44vh'}}
            autoPlay
            loop
            controls
            acknowledgeRemotionLicense
          />
        </div>

        <dl className="facts">
          <div className="fact">
            <dt>Composition</dt>
            <dd>
              {meta.width}×{meta.height} · {meta.fps}fps
            </dd>
          </div>
          <div className="fact">
            <dt>Length</dt>
            <dd>
              {meta.durationInFrames} frames · {seconds}s
            </dd>
          </div>
          <div className="fact">
            <dt>Category</dt>
            <dd>{CATEGORY_LABEL[meta.category]}</dd>
          </div>
          <div className="fact">
            <dt>Level</dt>
            <dd style={{textTransform: 'capitalize'}}>{meta.difficulty}</dd>
          </div>
          <div className="fact">
            <dt>Packages</dt>
            <dd>{meta.packages.join(', ')}</dd>
          </div>
        </dl>

        <nav className="tabs">
          {(['prompt', 'code', 'about'] as const).map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t === 'prompt' ? 'AI prompt' : t === 'code' ? 'Source' : 'About'}
            </button>
          ))}
        </nav>

        <div className="pane">
          {tab === 'prompt' && (
            <>
              <div className="paneactions">
                <button
                  className={`btn primary ${copied === `${meta.id}:prompt` ? 'done' : ''}`}
                  onClick={() => onCopy(prompt, `${meta.id}:prompt`)}
                >
                  {copied === `${meta.id}:prompt` ? 'Copied ✓' : 'Copy full prompt'}
                </button>
                <span className="hint">
                  Self-contained — paste into any coding agent, no Remotion skills required.
                </span>
              </div>
              <pre>{prompt}</pre>
            </>
          )}

          {tab === 'code' && (
            <>
              <div className="paneactions">
                <button
                  className={`btn primary ${copied === `${meta.id}:code` ? 'done' : ''}`}
                  onClick={() => onCopy(source, `${meta.id}:code`)}
                >
                  {copied === `${meta.id}:code` ? 'Copied ✓' : 'Copy source'}
                </button>
                <span className="hint">
                  <code>src/effects/{file}</code> — one file, drop it in and register it.
                </span>
              </div>
              <pre dangerouslySetInnerHTML={{__html: highlight(source)}} />
            </>
          )}

          {tab === 'about' && (
            <div className="md">
              <p>{meta.description}</p>
              <h3>Techniques used</h3>
              <div className="tagrow">
                {meta.concepts.map((c) => (
                  <span className="tag" key={c}>
                    {c}
                  </span>
                ))}
              </div>
              <h3>Search tags</h3>
              <div className="tagrow">
                {meta.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              {meta.credit && (
                <>
                  <h3>Credit</h3>
                  <p>
                    {meta.credit.url ? (
                      <a href={meta.credit.url} target="_blank" rel="noreferrer">
                        {meta.credit.label}
                      </a>
                    ) : (
                      meta.credit.label
                    )}
                  </p>
                </>
              )}
              <h3>The brief this effect was built from</h3>
              <Markdown source={briefOf(file)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── app ─────────────────────────────────────────────────────────────────── */

export const App: React.FC = () => {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const onCopy = useCallback((text: string, what: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(what);
      setToast(what.endsWith(':prompt') ? 'Prompt copied to clipboard' : 'Source copied to clipboard');
      setTimeout(() => setCopied(null), 1800);
      setTimeout(() => setToast(null), 1800);
    });
  }, []);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        ev.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const byCat = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const e of effects) counts.set(e.meta.category, (counts.get(e.meta.category) ?? 0) + 1);
    return counts;
  }, []);

  const visible = useMemo(
    () =>
      effects.filter(
        (e) => (cat === 'all' || e.meta.category === cat) && (!q.trim() || matches(e, q)),
      ),
    [q, cat],
  );

  const open = openId ? effects.find((e) => e.meta.id === openId) : null;
  const categories = CATEGORY_ORDER.filter((c) => byCat.has(c));

  return (
    <div className="shell">
      <header className="masthead">
        <h1>
          Remotion <em>Effects Library</em>
        </h1>
        <p>
          A catalogue of production-ready motion for Remotion. Every entry plays live in the browser,
          ships as one copy-pasteable file, and comes with a self-contained prompt you can hand to any
          coding agent — no Remotion skills installed required.
        </p>
        <div className="stats">
          <span>
            <b>{effects.length}</b> effects
          </span>
          <span>
            <b>{categories.length}</b> categories
          </span>
          <span>
            Remotion <b>4.0.522</b>
          </span>
        </div>
      </header>

      <div className="controls">
        <div className="searchrow">
          <div className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--fg-faint)'}} aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={searchRef}
              value={q}
              onChange={(ev) => setQ(ev.target.value)}
              placeholder="Search effects, techniques, packages…"
              aria-label="Search effects"
            />
            {q ? (
              <button className="clear" onClick={() => setQ('')} aria-label="Clear search">
                ×
              </button>
            ) : (
              <span className="kbd">/</span>
            )}
          </div>

          <div className="libs">
            <span className="libs-label">Library</span>
            {LIBRARIES.map((l) => {
              // Count against the CURRENT category so the numbers never lie.
              const n = effects.filter(
                (e) => (cat === 'all' || e.meta.category === cat) && matches(e, l.q),
              ).length;
              if (n === 0) return null;
              return (
                <button
                  key={l.label}
                  className={`lib ${q === l.q ? 'on' : ''}`}
                  onClick={() => setQ(q === l.q ? '' : l.q)}
                >
                  {l.label} <span className="n">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="chips">
          <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>
            All <span className="n">{effects.length}</span>
          </button>
          {categories.map((c) => (
            <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
              {CATEGORY_LABEL[c]} <span className="n">{byCat.get(c)}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <b>Nothing matches “{q}”</b>
          Try a technique (“spring”, “mask”), a package, or clear the filters.
        </div>
      ) : (
        <div className="grid">
          {visible.map((e) => (
            <Card
              key={e.meta.id}
              entry={e}
              copied={copied}
              onCopy={onCopy}
              onOpen={() => setOpenId(e.meta.id)}
            />
          ))}
        </div>
      )}

      {open && (
        <Detail entry={open} copied={copied} onCopy={onCopy} onClose={() => setOpenId(null)} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};
