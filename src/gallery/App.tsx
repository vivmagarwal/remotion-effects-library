import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Player, Thumbnail} from '@remotion/player';
import {effects} from '../registry.generated';
import type {EffectEntry, EffectMeta} from '../types';
import {briefOf, promptComposerReady, promptFor, sourceOf} from './sources';
import {CATEGORY_LABEL, CATEGORY_ORDER} from './categories';
import {Markdown} from './Markdown';
import {highlight} from './highlight';

const REPO = 'https://github.com/vivmagarwal/remotion-effects-library';
const REMOTION_VERSION = '4.0.522';

/* ── meta fields the taxonomy is still growing into ──────────────────────── */

/**
 * `requires`, `ground` and `audience` are new on EffectMeta and are being filled
 * in effect by effect. Reading them through this cast means the gallery works
 * on a registry where none of them are set yet: every facet below hides itself
 * when no effect declares a value.
 */
type MetaX = EffectMeta & {
  readonly requires?: readonly string[];
  readonly ground?: string;
  readonly audience?: readonly string[];
  readonly gpu?: boolean;
};
const mx = (m: EffectMeta) => m as MetaX;

const label = (c: string) => (CATEGORY_LABEL as Record<string, string>)[c] ?? c;

/** Position in the curated display order; anything unknown sorts to the end. */
const catRank = (c: string) => {
  const i = (CATEGORY_ORDER as readonly string[]).indexOf(c);
  return i < 0 ? CATEGORY_ORDER.length : i;
};

/**
 * Sections that are new to the library and would otherwise be a chip among
 * sixteen. Listed by id and filtered against what the registry actually
 * contains, so this degrades to nothing until those categories exist.
 */
const SPOTLIGHT: readonly string[] = ['edit', 'diagrams', 'captions', 'sound', 'grade'];

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ── search ──────────────────────────────────────────────────────────────── */

// Cached: with the library chips each computing a count, this runs
// effects × libraries times per keystroke otherwise.
const haystackCache = new WeakMap<EffectEntry, string>();

const buildHaystack = (e: EffectEntry) => {
  const m = mx(e.meta);
  return [
    m.name,
    m.tagline,
    m.description,
    m.category,
    label(m.category),
    m.difficulty,
    ...(m.requires ?? []),
    ...(m.audience ?? []),
    ...m.tags,
    ...m.concepts,
    ...m.packages,
  ]
    .join(' ')
    .toLowerCase();
};

const haystack = (e: EffectEntry) => {
  let h = haystackCache.get(e);
  if (h === undefined) {
    h = buildHaystack(e);
    haystackCache.set(e, h);
  }
  return h;
};

/** Terms are pre-split at module scope for the library chips — see LIBRARIES. */
const matchesTerms = (e: EffectEntry, terms: readonly string[]) => {
  const h = haystack(e);
  return terms.every((t) => h.includes(t));
};

const split = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);

/** Library facet. Each is a match against the haystack, which already indexes
 *  `packages` — so these need no separate index, only their own filter state. */
const LIBRARIES: readonly {readonly label: string; readonly terms: readonly string[]}[] = [
  {label: 'three.js', terms: ['three.js']},
  {label: 'D3', terms: ['d3-']},
  {label: '@remotion/effects', terms: ['@remotion/effects']},
  {label: 'transitions', terms: ['@remotion/transitions']},
  {label: 'media', terms: ['@remotion/media']},
  {label: 'paths', terms: ['@remotion/paths']},
  {label: 'shapes', terms: ['@remotion/shapes']},
  {label: 'audio', terms: ['@remotion/media-utils']},
  {label: 'captions', terms: ['@remotion/captions']},
  {label: 'GLSL shaders', terms: ['shader']},
  {label: 'SVG', terms: ['svg']},
  {label: 'CSS', terms: ['css']},
];

/* ── filters ─────────────────────────────────────────────────────────────── */

type SortKey = 'featured' | 'name' | 'difficulty' | 'duration';

const SORTS: readonly {readonly key: SortKey; readonly label: string}[] = [
  {key: 'featured', label: 'By category'},
  {key: 'name', label: 'A–Z'},
  {key: 'difficulty', label: 'Easiest first'},
  {key: 'duration', label: 'Shortest first'},
];

const DIFF_RANK: Record<string, number> = {starter: 0, intermediate: 1, advanced: 2};

type Facet = 'requires' | 'ground' | 'audience' | 'difficulty' | 'lib';

type Filters = {
  q: string;
  cat: string;
  sort: SortKey;
  requires: readonly string[];
  ground: readonly string[];
  audience: readonly string[];
  difficulty: readonly string[];
  lib: readonly string[];
};

const EMPTY: Filters = {
  q: '',
  cat: 'all',
  sort: 'featured',
  requires: [],
  ground: [],
  audience: [],
  difficulty: [],
  lib: [],
};

const FACET_LABEL: Record<Facet, string> = {
  requires: 'Needs',
  ground: 'Ground',
  audience: 'For',
  difficulty: 'Level',
  lib: 'Library',
};

const toggle = (list: readonly string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

/** One facet's test. Empty selection means "no opinion", never "match nothing". */
const passes = (e: EffectEntry, f: Filters, skip?: Facet) => {
  const m = mx(e.meta);
  if (f.cat !== 'all' && m.category !== f.cat) return false;
  if (skip !== 'requires' && f.requires.length) {
    const r = m.requires ?? [];
    if (!f.requires.some((x) => r.includes(x))) return false;
  }
  if (skip !== 'ground' && f.ground.length) {
    if (!f.ground.includes(m.ground ?? 'dark')) return false;
  }
  if (skip !== 'audience' && f.audience.length) {
    const a = m.audience ?? [];
    if (!f.audience.some((x) => a.includes(x))) return false;
  }
  if (skip !== 'difficulty' && f.difficulty.length) {
    if (!f.difficulty.includes(m.difficulty)) return false;
  }
  if (skip !== 'lib' && f.lib.length) {
    const hit = LIBRARIES.filter((l) => f.lib.includes(l.label)).some((l) => matchesTerms(e, l.terms));
    if (!hit) return false;
  }
  return true;
};

/* ── URL ─────────────────────────────────────────────────────────────────── */

/**
 * Hash routing, so an effect has an address.
 *
 * `#/effect/<id>` opens the sheet; anything else is the grid with its filters in
 * the query. Hash routing rather than real paths because a GitHub Pages project
 * site serves from a subpath and has no rewrite rules — no 404.html copy needed.
 */
const idFromHash = (hash: string): string | null => {
  const m = hash.match(/^#\/effect\/([^?/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

const filtersFromHash = (hash: string): Filters => {
  const qs = hash.slice(hash.indexOf('?') + 1);
  if (!hash.includes('?')) return EMPTY;
  const p = new URLSearchParams(qs);
  const many = (k: string) => (p.get(k) ? p.get(k)!.split(',').filter(Boolean) : []);
  const sort = p.get('sort') as SortKey | null;
  return {
    q: p.get('q') ?? '',
    cat: p.get('cat') ?? 'all',
    sort: SORTS.some((s) => s.key === sort) ? sort! : 'featured',
    requires: many('req'),
    ground: many('ground'),
    audience: many('aud'),
    difficulty: many('level'),
    lib: many('lib'),
  };
};

const hashForFilters = (f: Filters): string => {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.cat !== 'all') p.set('cat', f.cat);
  if (f.sort !== 'featured') p.set('sort', f.sort);
  if (f.requires.length) p.set('req', f.requires.join(','));
  if (f.ground.length) p.set('ground', f.ground.join(','));
  if (f.audience.length) p.set('aud', f.audience.join(','));
  if (f.difficulty.length) p.set('level', f.difficulty.join(','));
  if (f.lib.length) p.set('lib', f.lib.join(','));
  const qs = p.toString();
  return qs ? `#/?${qs}` : '#/';
};

/* ── theme ───────────────────────────────────────────────────────────────── */

type ThemeMode = 'light' | 'dark' | 'system';
const THEME_KEY = 'rel-theme';
const MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

const readMode = (): ThemeMode => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
};

const prefersDark = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;

const applyMode = (mode: ThemeMode) => {
  const dark = mode === 'dark' || (mode === 'system' && prefersDark());
  const root = document.documentElement;
  // One frame with transitions suppressed, or 180 cards cross-fade at once.
  root.classList.add('theme-switching');
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.themeMode = mode;
  root.style.colorScheme = dark ? 'dark' : 'light';
  requestAnimationFrame(() => root.classList.remove('theme-switching'));
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* storage disabled — the choice just does not survive the tab */
  }
};

const ThemeIcon: React.FC<{mode: ThemeMode}> = ({mode}) => {
  const p = {fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const};
  if (mode === 'light')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden {...p}>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
      </svg>
    );
  if (mode === 'dark')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden {...p}>
        <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
      </svg>
    );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden {...p}>
      <rect x="2.8" y="4.2" width="18.4" height="12.4" rx="2" />
      <path d="M8.6 20.4h6.8M12 16.6v3.8" />
    </svg>
  );
};

/**
 * Three states, never two. "System" is a real preference the OS can change
 * mid-session, and a boolean switch throws it away permanently the first time
 * somebody clicks.
 */
const ThemeControl: React.FC<{mode: ThemeMode; onChange: (m: ThemeMode) => void; id: string}> = ({
  mode,
  onChange,
  id,
}) => (
  <div className="theme" role="radiogroup" aria-label="Colour theme">
    {MODES.map((m) => (
      <button
        key={m}
        id={`${id}-${m}`}
        role="radio"
        aria-checked={mode === m}
        tabIndex={mode === m ? 0 : -1}
        onClick={() => onChange(m)}
        title={`${titleCase(m)} theme`}
      >
        <ThemeIcon mode={m} />
        <span className="t-label">{titleCase(m)}</span>
      </button>
    ))}
  </div>
);

/* ── viewport gating ─────────────────────────────────────────────────────── */

/**
 * Mounts a card's poster only while it is near the viewport.
 *
 * Every <Thumbnail> is a live Remotion render, and the three.js and
 * @remotion/effects entries each hold a WebGL context. Browsers cap those at
 * roughly 16 (fewer on Safari/iOS), so mounting all ~180 posters at once evicts
 * the oldest contexts and those thumbnails go blank — measured at 88 effects,
 * one top-to-bottom scroll already produced 22 "Too many active WebGL contexts"
 * warnings with a flat 700px margin. GPU effects therefore get a much tighter
 * margin than DOM/SVG ones: roughly what is on screen, and no more.
 */
const useNearViewport = <T extends Element>(rootMargin: string) => {
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

const isGpu = (m: EffectMeta) => {
  const x = mx(m);
  if (typeof x.gpu === 'boolean') return x.gpu;
  return m.packages.some(
    (p) => p === 'three' || p.startsWith('@remotion/three') || p.startsWith('@remotion/effects'),
  );
};

/* ── card ────────────────────────────────────────────────────────────────── */

const PlayIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5v14l11-7z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
);

const Card: React.FC<{
  /** How many variants this effect has, if it is the head of a family. */
  familyCount?: number;
  familyOpen?: boolean;
  onToggleFamily?: () => void;
  entry: EffectEntry;
  onOpen: () => void;
  onCopy: (text: string, what: string) => void;
  copied: string | null;
}> = ({entry, onOpen, onCopy, copied, familyCount = 0, familyOpen = false, onToggleFamily}) => {
  const {meta, Component, file} = entry;
  const [playing, setPlaying] = useState(false);
  const [stageRef, near] = useNearViewport<HTMLDivElement>(isGpu(meta) ? '150px' : '600px');

  // A <Player> that is scrolled away keeps its rAF loop, its WebGL context and
  // its audio tag alive for the rest of the session. Ten clicked cards used to
  // mean ten live compositions; now leaving the viewport stops it.
  useEffect(() => {
    if (!near && playing) setPlaying(false);
  }, [near, playing]);

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
  const requires = mx(meta).requires ?? [];
  const ground = mx(meta).ground ?? 'dark';

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
        {playing && near ? (
          <div className="stage-media" data-ground={ground} style={box}>
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
            <div className="stage-media" data-ground={ground} style={box}>
              {near ? (
                <Thumbnail
                  component={Component}
                  durationInFrames={meta.durationInFrames}
                  compositionWidth={meta.width}
                  compositionHeight={meta.height}
                  fps={meta.fps}
                  frameToDisplay={meta.posterFrame ?? meta.checkFrame}
                  style={{width: '100%'}}
                  errorFallback={() => <div className="posterfail">preview failed</div>}
                />
              ) : null}
            </div>
            <div className="playbtn">
              <i>
                <PlayIcon />
              </i>
            </div>
            {requires.length ? (
              <div className="needs">
                {requires.map((r) => (
                  <span key={r}>{r}</span>
                ))}
              </div>
            ) : null}
            <span className="ratio">
              {meta.width}×{meta.height}
            </span>
          </>
        )}
      </div>

      <div className="cardbody">
        <div className="cardhead">
          <h3>{meta.name}</h3>
          <span className="cat">{label(meta.category)}</span>
        </div>
        <p>{meta.tagline}</p>
        <div className="cardtags">
          {meta.tags.slice(0, 3).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        {familyCount > 0 && onToggleFamily ? (
          <button className="family" onClick={onToggleFamily} aria-expanded={familyOpen}>
            {familyOpen ? 'Hide' : 'Show all'} {familyCount} variants
          </button>
        ) : null}
        <div className="cardfoot">
          <button onClick={onOpen}>Details</button>
          <button
            className={copied === `${meta.id}:prompt` ? 'done' : ''}
            onClick={() => onCopy(promptFor(meta, file), `${meta.id}:prompt`)}
          >
            {copied === `${meta.id}:prompt` ? 'Copied' : <><CopyIcon /> Prompt</>}
          </button>
          <button
            className={copied === `${meta.id}:code` ? 'done' : ''}
            onClick={() => onCopy(sourceOf(file), `${meta.id}:code`)}
          >
            {copied === `${meta.id}:code` ? 'Copied' : <><CopyIcon /> Code</>}
          </button>
        </div>
      </div>
    </article>
  );
};

/* ── detail sheet ────────────────────────────────────────────────────────── */

type Tab = 'prompt' | 'code' | 'about';
const TABS: readonly {readonly key: Tab; readonly label: string}[] = [
  {key: 'prompt', label: 'AI prompt'},
  {key: 'code', label: 'Source'},
  {key: 'about', label: 'About'},
];
const TAB_KEY = 'rel-tab';

const Arrow: React.FC<{dir: 'left' | 'right'}> = ({dir}) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
);

const Detail: React.FC<{
  entry: EffectEntry;
  onClose: () => void;
  onCopy: (text: string, what: string) => void;
  copied: string | null;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}> = ({entry, onClose, onCopy, copied, onPrev, onNext}) => {
  const {meta, Component, file} = entry;
  const m = mx(meta);
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const v = localStorage.getItem(TAB_KEY);
      return v === 'prompt' || v === 'code' || v === 'about' ? v : 'prompt';
    } catch {
      return 'prompt';
    }
  });
  const prompt = useMemo(() => promptFor(meta, file), [meta, file]);
  const source = useMemo(() => sourceOf(file), [file]);
  const sheetRef = useRef<HTMLDivElement>(null);

  const pickTab = (t: Tab) => {
    setTab(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* ignore */
    }
  };

  // Modal behaviour the sheet never had: focus moves in, focus is trapped,
  // the page behind stops scrolling, and focus returns where it came from.
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const {overflow} = document.body.style;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        onClose();
        return;
      }
      if (ev.key === 'Tab') {
        const nodes = sheetRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!nodes || !nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
        return;
      }
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? '');
      if (typing) return;
      if (ev.key === 'ArrowLeft' && onPrev) onPrev();
      if (ev.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const seconds = (meta.durationInFrames / meta.fps).toFixed(1);
  const requires = m.requires ?? [];
  const ground = m.ground ?? 'dark';

  return (
    <div className="scrim" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
        ref={sheetRef}
      >
        <header className="sheethead">
          <div>
            <h2 id="sheet-title">{meta.name}</h2>
            <p className="sub">{meta.description}</p>
          </div>
          <div className="sheetnav">
            <button className="iconbtn" onClick={() => onPrev?.()} disabled={!onPrev} aria-label="Previous effect">
              <Arrow dir="left" />
            </button>
            <button className="iconbtn" onClick={() => onNext?.()} disabled={!onNext} aria-label="Next effect">
              <Arrow dir="right" />
            </button>
            <button className="iconbtn" onClick={onClose} aria-label="Close">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="sheetplayer">
          {/* The frame is a wrapper, not the Player: capping only the Player's
              height leaves its BOX full width and letterboxes the composition
              inside it, so the rounded frame would hug empty space. Capping the
              wrapper's width at the composition's own aspect makes box and
              picture agree — and gives the checkerboard somewhere to live. */}
          <div
            className="sheetframe"
            data-ground={ground}
            style={{maxWidth: `calc(56vh * ${(meta.width / meta.height).toFixed(4)})`}}
          >
            <Player
              component={Component}
              durationInFrames={meta.durationInFrames}
              compositionWidth={meta.width}
              compositionHeight={meta.height}
              fps={meta.fps}
              style={{width: '100%', display: 'block'}}
              autoPlay
              loop
              controls
              acknowledgeRemotionLicense
            />
          </div>
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
            <dd>{label(meta.category)}</dd>
          </div>
          <div className="fact">
            <dt>Level</dt>
            <dd style={{textTransform: 'capitalize'}}>{meta.difficulty}</dd>
          </div>
          <div className="fact">
            <dt>Ground</dt>
            <dd style={{textTransform: 'capitalize'}}>{ground}</dd>
          </div>
          <div className="fact">
            <dt>Needs</dt>
            <dd>{requires.length ? requires.join(', ') : 'nothing — self-contained'}</dd>
          </div>
          <div className="fact">
            <dt>Packages</dt>
            <dd>{meta.packages.join(', ') || 'none beyond remotion'}</dd>
          </div>
        </dl>

        <div className="tabs" role="tablist" aria-label="Effect detail">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              tabIndex={tab === t.key ? 0 : -1}
              onClick={() => pickTab(t.key)}
              onKeyDown={(ev) => {
                if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
                ev.preventDefault();
                const next = (i + (ev.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
                pickTab(TABS[next].key);
                document.getElementById(`tab-${TABS[next].key}`)?.focus();
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pane" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
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
                  {promptComposerReady
                    ? 'The same prompt npm run check:prompts gates — paste into any coding agent.'
                    : 'Prompt composer not wired into this build — see the panel below.'}
                </span>
              </div>
              <pre className="code-block wrap">{prompt}</pre>
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
              <pre className="code-block" dangerouslySetInnerHTML={{__html: highlight(source)}} />
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

/* ── empty state suggestions ─────────────────────────────────────────────── */

const distance = (a: string, b: string) => {
  const prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
};

const VOCAB = Array.from(new Set(effects.flatMap((e) => e.meta.tags))).sort();

/** Three nearest tags to what was typed — an escape hatch that is one click. */
const nearestTags = (q: string) => {
  const term = split(q)[0] ?? '';
  if (!term) return VOCAB.slice(0, 3);
  return VOCAB.map((t) => [t, distance(term, t.toLowerCase())] as const)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([t]) => t);
};

/* ── app ─────────────────────────────────────────────────────────────────── */

export const App: React.FC = () => {
  const [filters, setFilters] = useState<Filters>(() => filtersFromHash(location.hash));
  const [openId, setOpenId] = useState<string | null>(() => idFromHash(location.hash));
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showFacets, setShowFacets] = useState(false);
  const [mode, setMode] = useState<ThemeMode>(readMode);
  const searchRef = useRef<HTMLInputElement>(null);
  const pushedRef = useRef(false);

  const set = useCallback(<K extends keyof Filters>(k: K, v: Filters[K]) => {
    setFilters((f) => ({...f, [k]: v}));
  }, []);

  const clearAll = useCallback(() => setFilters(EMPTY), []);

  /* theme */
  useEffect(() => {
    applyMode(mode);
    if (mode !== 'system' || typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyMode('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  /* the URL is the address of an effect */
  useEffect(() => {
    const onHash = () => {
      const id = idFromHash(location.hash);
      setOpenId(id);
      if (!id) pushedRef.current = false;
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openEffect = useCallback((id: string) => {
    pushedRef.current = true;
    location.hash = `#/effect/${encodeURIComponent(id)}`;
  }, []);

  const closeSheet = useCallback(() => {
    // Back if we pushed the entry ourselves, so the browser's Back button and
    // the close button agree. On a cold deep link there is nothing to go back
    // to, so rewrite the entry instead of throwing the visitor off the site.
    if (pushedRef.current) {
      history.back();
    } else {
      history.replaceState(null, '', hashForFilters(filters) || './');
      setOpenId(null);
    }
  }, [filters]);

  /* filters live in the URL too, but only ever replace the entry */
  useEffect(() => {
    if (idFromHash(location.hash)) return;
    const next = hashForFilters(filters);
    if (location.hash !== next && !(next === '#/' && location.hash === '')) {
      history.replaceState(null, '', next);
    }
  }, [filters]);

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
      const el = document.activeElement as HTMLElement | null;
      const typing =
        /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName ?? '') || el?.isContentEditable === true;
      if (ev.key === 'Escape' && typing && el?.tagName === 'INPUT') {
        set('q', '');
        return;
      }
      if (typing || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (idFromHash(location.hash)) return; // the sheet owns the keyboard
      if (ev.key === '/') {
        ev.preventDefault();
        searchRef.current?.focus();
      }
      if (ev.key === 't' || ev.key === 'T') {
        ev.preventDefault();
        setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [set]);

  /* ── derived data ─────────────────────────────────────────────────────── */

  const byCat = useMemo(() => {
    const counts = new Map<string, number>();
    // Families count once here too, so the rail reads "Diagrams 9" rather than
    // "Diagrams 92" — the sidebar is a map of the library, not of the registry.
    for (const e of effects)
      if (!e.parentId) counts.set(e.meta.category, (counts.get(e.meta.category) ?? 0) + 1);
    return counts;
  }, []);

  const categories = useMemo(
    () => (CATEGORY_ORDER as readonly string[]).filter((c) => byCat.has(c)),
    [byCat],
  );

  const terms = useMemo(() => split(filters.q), [filters.q]);

  /**
   * Variants are hidden from the grid unless their family is expanded, or unless
   * the search is specific enough to be asking for them.
   *
   * `viz-gallery` alone ships 83 variants. Shown flat they would be 83 of the
   * grid's cards, and — worse — 83 live `<Thumbnail>`s, which is five times the
   * browser's WebGL context budget. So the parent card carries the family and
   * says how many are inside; a search term that matches a variant's own name
   * surfaces it directly, because someone typing "sankey" wants the sankey card
   * and not a lecture about grouping.
   */
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const familySize = useMemo(() => {
    const n = new Map<string, number>();
    for (const e of effects) if (e.parentId) n.set(e.parentId, (n.get(e.parentId) ?? 0) + 1);
    return n;
  }, []);

  const visible = useMemo(() => {
    const searching = terms.length > 0;
    const list = effects.filter((e) => {
      if (!(passes(e, filters) && matchesTerms(e, terms))) return false;
      if (!e.parentId) return true;
      return searching || expanded.has(e.parentId);
    });
    // The registry is ordered `category ASC, id ASC` — alphabetical, which puts
    // Backgrounds first and Video Editing near the end. The curated order lives
    // in CATEGORY_ORDER, so the default view uses that.
    if (filters.sort === 'featured')
      return [...list].sort((a, b) => catRank(a.meta.category) - catRank(b.meta.category));
    if (filters.sort === 'name') return [...list].sort((a, b) => a.meta.name.localeCompare(b.meta.name));
    if (filters.sort === 'difficulty')
      return [...list].sort(
        (a, b) =>
          (DIFF_RANK[a.meta.difficulty] ?? 9) - (DIFF_RANK[b.meta.difficulty] ?? 9) ||
          a.meta.name.localeCompare(b.meta.name),
      );
    if (filters.sort === 'duration')
      return [...list].sort(
        (a, b) =>
          a.meta.durationInFrames / a.meta.fps - b.meta.durationInFrames / b.meta.fps ||
          a.meta.name.localeCompare(b.meta.name),
      );
    return list;
  }, [filters, terms, expanded]);

  /**
   * Every facet count, computed once per filter change instead of inside the
   * render body. The old library row ran `effects × libraries` matches on every
   * keystroke AND on every copy/toast transition — 880 at 88 effects, ~2,000 at
   * 180.
   */
  const counts = useMemo(() => {
    const tally = (facet: Facet, value: (e: EffectEntry) => readonly string[]) => {
      const map = new Map<string, number>();
      for (const e of effects) {
        if (!passes(e, filters, facet) || !matchesTerms(e, terms)) continue;
        for (const v of value(e)) map.set(v, (map.get(v) ?? 0) + 1);
      }
      return map;
    };
    return {
      cat: (() => {
        const map = new Map<string, number>();
        for (const e of effects) {
          if (!passes(e, {...filters, cat: 'all'}) || !matchesTerms(e, terms)) continue;
          map.set(e.meta.category, (map.get(e.meta.category) ?? 0) + 1);
        }
        return map;
      })(),
      requires: tally('requires', (e) => mx(e.meta).requires ?? []),
      ground: tally('ground', (e) => [mx(e.meta).ground ?? 'dark']),
      audience: tally('audience', (e) => mx(e.meta).audience ?? []),
      difficulty: tally('difficulty', (e) => [e.meta.difficulty]),
      lib: tally('lib', (e) => LIBRARIES.filter((l) => matchesTerms(e, l.terms)).map((l) => l.label)),
    };
  }, [filters, terms]);

  /** A facet only appears when some effect actually declares a value for it. */
  const has = {
    requires: counts.requires.size > 0 || filters.requires.length > 0,
    ground: counts.ground.size > 1 || filters.ground.length > 0,
    audience: counts.audience.size > 0 || filters.audience.length > 0,
  };

  const activeCount =
    (filters.cat !== 'all' ? 1 : 0) +
    filters.requires.length +
    filters.ground.length +
    filters.audience.length +
    filters.difficulty.length +
    filters.lib.length +
    (filters.q ? 1 : 0);

  const open = openId ? effects.find((e) => e.meta.id === openId) ?? null : null;
  const openIndex = open ? visible.findIndex((e) => e.meta.id === open.meta.id) : -1;

  const step = (delta: number) => {
    if (openIndex < 0) return null;
    const next = visible[openIndex + delta];
    return next ? () => openEffect(next.meta.id) : null;
  };

  /** Cards, with a category heading whenever the grid spans more than one. */
  const rows = useMemo(() => {
    if (filters.sort !== 'featured' || filters.cat !== 'all') return [{cat: null, items: visible}];
    const groups: {cat: string; items: EffectEntry[]}[] = [];
    for (const e of visible) {
      const last = groups[groups.length - 1];
      if (last && last.cat === e.meta.category) last.items.push(e);
      else groups.push({cat: e.meta.category, items: [e]});
    }
    return groups;
  }, [visible, filters.sort, filters.cat]);

  const spotlights = SPOTLIGHT.filter((c) => byCat.has(c));

  const crumbs: {label: string; onRemove: () => void}[] = [
    ...(filters.q ? [{label: `“${filters.q}”`, onRemove: () => set('q', '')}] : []),
    ...(filters.cat !== 'all' ? [{label: label(filters.cat), onRemove: () => set('cat', 'all')}] : []),
    ...(['requires', 'ground', 'audience', 'difficulty', 'lib'] as const).flatMap((f) =>
      filters[f].map((v) => ({
        label: `${FACET_LABEL[f]}: ${v}`,
        onRemove: () => set(f, toggle(filters[f], v)),
      })),
    ),
  ];

  const facetRow = (facet: Facet, options: readonly string[], dashed = false) => (
    <div>
      <div className="facet-h">{FACET_LABEL[facet]}</div>
      <div className="facet-row">
        {options.map((v) => {
          const n = counts[facet].get(v) ?? 0;
          const on = filters[facet].includes(v);
          if (!n && !on) return null;
          return (
            <button
              key={v}
              className={`pill ${dashed ? 'dashed' : ''} ${on ? 'on' : ''}`}
              aria-pressed={on}
              onClick={() => set(facet, toggle(filters[facet], v))}
            >
              {v} <span className="n">{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <a className="skip" href="#effects">
        Skip to the effects
      </a>
      <div className="shell">
        <header className="masthead">
          <div className="mastrow">
            <div>
              <h1>
                Remotion <em>Effects Library</em>
              </h1>
              <p className="lead">
                A catalogue of production-ready motion for Remotion — every entry plays live in the
                browser, ships as one copy-pasteable file, and comes with a self-contained prompt you
                can hand to any coding agent.
              </p>
            </div>
            <div className="mastright">
              <div>
                <ThemeControl mode={mode} onChange={setMode} id="theme-top" />
                <p className="theme-hint">
                  <kbd>t</kbd> cycles · <kbd>/</kbd> searches
                </p>
              </div>
            </div>
          </div>

          <div className="stats">
            {/* Two numbers, because they are two different things and one of them
                would be a boast. `effects` includes every expanded variant, so
                the 83 diagram templates would read as 83 effects; they are one
                effect with 83 prop sets. Count families once and say how many
                compositions that actually amounts to. */}
            <span>
              <b>{effects.filter((e) => !e.parentId).length}</b> effects
            </span>
            <span>
              <b>{effects.length}</b> compositions
            </span>
            <span>
              <b>{categories.length}</b> categories
            </span>
            <span>
              Remotion <b>{REMOTION_VERSION}</b>
            </span>
          </div>

          <div className="ways">
            <div className="way">
              <div className="n">01</div>
              <h2>Watch it</h2>
              <p>
                Click any card and the real composition plays in the browser at its real frame rate.
                No install, no render.
              </p>
            </div>
            <div className="way">
              <div className="n">02</div>
              <h2>Copy one file</h2>
              <p>
                Every effect is a single self-contained <code>.tsx</code> with typed, defaulted props.
                Paste it into your project and register it.
              </p>
            </div>
            <div className="way">
              <div className="n">03</div>
              <h2>Copy the prompt</h2>
              <p>
                Hand the composed prompt to a coding agent that has never heard of Remotion — it
                carries the setup, the props table and the check frame.
              </p>
            </div>
          </div>

          {spotlights.length ? (
            <div className="spots">
              <span className="spots-label">Start here</span>
              {spotlights.map((c) => (
                <button key={c} className="spot" onClick={() => set('cat', c)}>
                  {label(c)} <span className="n">{byCat.get(c)}</span>
                </button>
              ))}
            </div>
          ) : null}

        </header>

        <div className="controls">
          <div className="searchrow">
            <div className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={searchRef}
                value={filters.q}
                onChange={(ev) => set('q', ev.target.value)}
                placeholder="Search effects, techniques, packages…"
                aria-label="Search effects"
              />
              {filters.q ? (
                <button className="clear" onClick={() => set('q', '')} aria-label="Clear search">
                  ×
                </button>
              ) : (
                <span className="kbd">/</span>
              )}
            </div>

            <div className="sortbox">
              <label htmlFor="sort">Sort</label>
              <select
                id="sort"
                className="sel"
                value={filters.sort}
                onChange={(ev) => set('sort', ev.target.value as SortKey)}
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="filterbtn"
              onClick={() => setShowFacets((v) => !v)}
              aria-expanded={showFacets}
            >
              Filters
              {activeCount ? <span className="n">{activeCount}</span> : null}
            </button>
          </div>

          <div className="railselect" style={{marginTop: 10}}>
            <label htmlFor="railcat" style={{fontSize: 12, color: 'var(--fg-faint)'}}>
              Category
            </label>
            <select
              id="railcat"
              className="sel"
              value={filters.cat}
              onChange={(ev) => set('cat', ev.target.value)}
            >
              <option value="all">All categories ({effects.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {label(c)} ({byCat.get(c)})
                </option>
              ))}
            </select>
          </div>

          {showFacets ? (
            <div className="facets">
              {has.requires ? facetRow('requires', ['video', 'audio', 'transcript', 'image']) : null}
              {has.ground ? facetRow('ground', ['dark', 'light', 'both', 'transparent']) : null}
              {has.audience
                ? facetRow('audience', [
                    'youtuber',
                    'saas',
                    'educator',
                    'data',
                    'agency',
                    'developer',
                    'podcaster',
                  ])
                : null}
              {facetRow('difficulty', ['starter', 'intermediate', 'advanced'])}
              {facetRow('lib', LIBRARIES.map((l) => l.label), true)}
            </div>
          ) : null}

          <div className="summary" hidden={activeCount === 0}>
            <span>
              <b>{visible.length}</b> {visible.length === 1 ? 'effect' : 'effects'}
            </span>
            {crumbs.map((c) => (
              <button key={c.label} className="crumb" onClick={c.onRemove}>
                {c.label} <i aria-hidden>×</i>
                <span className="sr-only">remove filter</span>
              </button>
            ))}
            {activeCount > 1 ? (
              <button className="crumb clear" onClick={clearAll}>
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        <div className="body">
          <nav className="rail" aria-label="Categories">
            <div className="rail-h">Sections</div>
            <button
              className={`rail-item ${filters.cat === 'all' ? 'on' : ''}`}
              onClick={() => set('cat', 'all')}
            >
              <span>All effects</span>
              <span className="n">{effects.length}</span>
            </button>
            <div className="rail-sep" />
            {categories.map((c) => (
              <button
                key={c}
                className={`rail-item ${filters.cat === c ? 'on' : ''}`}
                onClick={() => set('cat', c)}
              >
                <span>{label(c)}</span>
                <span className="n">{counts.cat.get(c) ?? 0}</span>
              </button>
            ))}
          </nav>

          <main id="effects">
            {visible.length === 0 ? (
              <div className="empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <b>{filters.q ? `No effects match “${filters.q}”` : 'No effects match these filters'}</b>
                Try a technique, a package name, or one of these:
                <div className="sug">
                  {nearestTags(filters.q).map((t) => (
                    <button key={t} className="pill" onClick={() => setFilters({...EMPTY, q: t})}>
                      {t}
                    </button>
                  ))}
                  <button className="pill" onClick={clearAll}>
                    Clear all filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid">
                {rows.map((g) => (
                  <React.Fragment key={g.cat ?? 'flat'}>
                    {g.cat && rows.length > 1 ? (
                      <div className="grouphead">
                        <h2>{label(g.cat)}</h2>
                        <span>
                          {g.items.length} {g.items.length === 1 ? 'effect' : 'effects'}
                        </span>
                      </div>
                    ) : null}
                    {g.items.map((e) => (
                      <Card
                        key={e.meta.id}
                        entry={e}
                        copied={copied}
                        onCopy={onCopy}
                        onOpen={() => openEffect(e.meta.id)}
                        familyCount={familySize.get(e.meta.id) ?? 0}
                        familyOpen={expanded.has(e.meta.id)}
                        onToggleFamily={
                          familySize.has(e.meta.id)
                            ? () =>
                                setExpanded((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(e.meta.id)) next.delete(e.meta.id);
                                  else next.add(e.meta.id);
                                  return next;
                                })
                            : undefined
                        }
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            )}
          </main>
        </div>

        <footer className="foot">
          <div>
            <h2>About</h2>
            <p>
              {effects.length} Remotion effects, each one file, each with a live preview and a
              standalone prompt. MIT licensed — take what you need.
            </p>
          </div>
          <div>
            <h2>Categories</h2>
            <ul>
              {categories.map((c) => (
                <li key={c}>
                  <a
                    href={`#/?cat=${c}`}
                    onClick={(ev) => {
                      ev.preventDefault();
                      set('cat', c);
                    }}
                  >
                    {label(c)} ({byCat.get(c)})
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Resources</h2>
            <ul>
              <li>
                <a href={REPO} target="_blank" rel="noreferrer">
                  Source on GitHub
                </a>
              </li>
              <li>
                <a href={`${REPO}#readme`} target="_blank" rel="noreferrer">
                  README — how this works
                </a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
                  Licence
                </a>
              </li>
              <li>
                <a href="https://www.remotion.dev/docs" target="_blank" rel="noreferrer">
                  Remotion documentation
                </a>
              </li>
              <li>
                <a href="https://www.remotion.dev/showcase" target="_blank" rel="noreferrer">
                  Remotion showcase
                </a>
              </li>
            </ul>
          </div>
          <div className="colophon">
            <span>
              Built with Remotion {REMOTION_VERSION} · Inter &amp; JetBrains Mono · {effects.length}{' '}
              effects
            </span>
            <ThemeControl mode={mode} onChange={setMode} id="theme-foot" />
          </div>
        </footer>
      </div>

      {open && (
        <Detail
          key={open.meta.id}
          entry={open}
          copied={copied}
          onCopy={onCopy}
          onClose={closeSheet}
          onPrev={step(-1)}
          onNext={step(1)}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
};
