import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Grid to Hero
 * The shared-element transition: a tile lifts out of a grid, grows into a
 * full-bleed hero, and drops back into exactly the slot it left. The grid slot
 * is computed once and used for both the tile's resting rect and the hero's
 * start rect, so the two can never disagree — which is what makes the return
 * land perfectly instead of approximately.
 */

type Item = {readonly src: string; readonly title: string; readonly meta: string};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly accent: string;
  readonly bg: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  accent: '#ff5c39',
  bg: '#0a0b10',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly items?: readonly Item[];
  readonly heading?: string;
  readonly columns?: number;
  readonly gap?: number;
  readonly padding?: number;
  /** Frames each hero is held open. */
  readonly holdFrames?: number;
  /** Frames the lift and the drop each take. */
  readonly morphFrames?: number;
  readonly startAt?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

const DEFAULT_ITEMS: Item[] = [
  {src: 'plate-1.svg', title: 'Golden hour', meta: 'PLATE 01 · 1500×1000'},
  {src: 'plate-4.svg', title: 'After dark', meta: 'PLATE 04 · 1500×1000'},
  {src: 'plate-5.svg', title: 'Low tide', meta: 'PLATE 05 · 1500×1000'},
  {src: 'plate-2.svg', title: 'Understory', meta: 'PLATE 02 · 1500×1000'},
  {src: 'plate-3.svg', title: 'Long dunes', meta: 'PLATE 03 · 1500×1000'},
  {src: 'sample-city.svg', title: 'Night grid', meta: 'PLATE 06 · 1920×1080'},
];

export const GridToHero: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  items = DEFAULT_ITEMS,
  heading = 'PLATES',
  columns = 3,
  gap = 26,
  padding = 70,
  holdFrames = 62,
  morphFrames = 18,
  startAt = 26,
  accentColor = theme.accent,
  backgroundColor = theme.bg,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const headerH = 168;
  const rows = Math.ceil(items.length / columns);
  const cellW = (width - padding * 2 - gap * (columns - 1)) / columns;
  const cellH = (height - headerH - padding - gap * (rows - 1)) / rows;

  /** The one place a tile's slot is defined. Both states read from it. */
  const slotOf = (i: number) => ({
    x: padding + (i % columns) * (cellW + gap),
    y: headerH + Math.floor(i / columns) * (cellH + gap),
    w: cellW,
    h: cellH,
  });

  const hero = {x: padding, y: headerH, w: width - padding * 2, h: height - headerH - padding};

  // Which tile is open, and how far. One cycle per item, in order.
  const cycle = morphFrames * 2 + holdFrames;
  const elapsed = frame - startAt;
  const openIndex = elapsed < 0 ? -1 : Math.floor(elapsed / cycle) % items.length;
  const within = elapsed < 0 ? 0 : elapsed % cycle;

  const open = interpolate(
    within,
    [0, morphFrames, morphFrames + holdFrames, cycle],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.5, 0, 0.2, 1),
    },
  );

  const enter = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });


  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <Interactive.Div
        name="Heading"
        style={{
          position: 'absolute',
          left: padding,
          top: 74,
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: '0.24em',
          color: '#ffffff',
          opacity: enter,
        }}
      >
        {heading}
      </Interactive.Div>
      <Interactive.Div
        name="Counter"
        style={{
          position: 'absolute',
          right: padding,
          top: 80,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 26,
          color: accentColor,
          fontVariantNumeric: 'tabular-nums',
          opacity: enter,
        }}
      >
        {String(Math.max(1, openIndex + 1)).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
      </Interactive.Div>

      {items.map((item, i) => {
        const slot = slotOf(i);
        const isOpen = i === openIndex;
        // The open tile lerps slot → hero. Everything else stays in its slot and
        // recedes, so the grid reads as a background rather than disappearing.
        const t = isOpen ? open : 0;
        const rect = {
          x: slot.x + (hero.x - slot.x) * t,
          y: slot.y + (hero.y - slot.y) * t,
          w: slot.w + (hero.w - slot.w) * t,
          h: slot.h + (hero.h - slot.h) * t,
        };

        const stagger = interpolate(frame, [i * 4, i * 4 + 22], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });

        return (
          <Interactive.Div
            key={item.src}
            name={item.title}
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              borderRadius: 18,
              overflow: 'hidden',
              backgroundColor: '#04050a',
              border: `2px solid ${isOpen ? accentColor : 'rgba(255,255,255,0.12)'}`,
              boxShadow: isOpen
                ? `0 40px 90px rgba(0,0,0,${0.55 * open})`
                : '0 10px 30px rgba(0,0,0,0.35)',
              // The open tile paints above every other.
              zIndex: isOpen ? 10 : 1,
              scale: stagger * (isOpen ? 1 : 1 - open * 0.04),
              opacity: stagger * (isOpen ? 1 : 1 - open * 0.55),
            }}
          >
            <CanvasImage
              src={staticFile(item.src)}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />

            {/* The caption only exists on the open tile, and fades in late so it
                never appears while the tile is still thumbnail-sized. */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: '120px 46px 40px',
                backgroundImage: 'linear-gradient(transparent, rgba(6,6,10,0.86))',
                opacity: isOpen
                  ? interpolate(open, [0.55, 1], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : 0,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: accentColor,
                  marginBottom: 12,
                }}
              >
                {item.meta}
              </div>
              <div style={{fontSize: 76, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em'}}>
                {item.title}
              </div>
            </div>
          </Interactive.Div>
        );
      })}
    </AbsoluteFill>
  );
};
