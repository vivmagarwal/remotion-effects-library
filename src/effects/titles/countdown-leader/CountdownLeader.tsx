import {AbsoluteFill, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Oswald';

const {fontFamily} = loadFont('normal', {weights: ['400', '500'], subsets: ['latin']});

/**
 * Countdown Leader
 * An Academy-style film leader: a sweeping wiper hand, crosshairs, and a number
 * per second. The sweep is derived from position within the current second, so
 * one expression drives the entire countdown regardless of its length.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly scheme: 'dark' | 'light';
  readonly display: string;
  readonly accentOnPaper: string;
  readonly paper: string;
  readonly paperInk: string;
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  scheme: 'dark',
  display: fontFamily,
  accentOnPaper: '#c2410c',
  paper: '#f6f5f2',
  paperInk: '#1d1b17',
  stroke: 3,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly from?: number;
  readonly finalWord?: string;
  readonly backgroundColor?: string;
  readonly inkColor?: string;
  readonly accentColor?: string;
  readonly grain?: boolean;
};

export const CountdownLeader: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.display,
  from = 5,
  finalWord = 'ACTION',
  // A leader is ink on stock. On a dark theme the stock is the dark one; on a
  // light-scheme theme the two swap and it prints dark on paper, the way a real
  // Academy leader does.
  backgroundColor = theme.scheme === 'light' ? theme.paper : theme.paperInk,
  inkColor = theme.scheme === 'light' ? theme.paperInk : theme.paper,
  accentColor = theme.accentOnPaper,
  grain = true,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const second = Math.floor(frame / fps);
  const withinSecond = (frame % fps) / fps;
  const number = from - second;
  const done = number <= 0;

  // The wiper sweeps a full turn every second.
  const sweep = withinSecond * 360;

  // Two-frame flash on each new number, the way a real leader punches.
  const punch = frame % fps < 2 ? 1 : 0;

  const R = Math.min(width, height) * 0.42;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden', fontFamily}}>
      {/* Crosshair, drawn edge to edge. */}
      <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: theme.stroke, marginLeft: -theme.stroke / 2, backgroundColor: `${inkColor}44`}} />
      <div style={{position: 'absolute', top: '50%', left: 0, right: 0, height: theme.stroke, marginTop: -theme.stroke / 2, backgroundColor: `${inkColor}44`}} />

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <svg width={R * 2} height={R * 2} style={{position: 'absolute'}}>
          <circle cx={R} cy={R} r={R - 6} fill="none" stroke={`${inkColor}55`} strokeWidth={(theme.stroke * 4) / 3} />
          <circle cx={R} cy={R} r={R * 0.62} fill="none" stroke={`${inkColor}33`} strokeWidth={theme.stroke} />
          {/* The wiper: a wedge rotating once per second. */}
          <path
            d={`M ${R} ${R} L ${R} 0 A ${R} ${R} 0 0 1 ${R} ${R * 2} Z`}
            fill={`${inkColor}12`}
            style={{rotate: `${sweep}deg`, transformOrigin: `${R}px ${R}px`}}
          />
          <line
            x1={R}
            y1={R}
            x2={R}
            y2={0}
            stroke={inkColor}
            strokeWidth={(theme.stroke * 5) / 3}
            style={{rotate: `${sweep}deg`, transformOrigin: `${R}px ${R}px`}}
          />
        </svg>

        <Interactive.Div
          name="Number"
          style={{
            fontSize: done ? 190 : 460,
            fontWeight: 500,
            // A serif theme's old-style figures otherwise drop off the crosshair centre.
            fontVariantNumeric: 'lining-nums',
            color: done ? accentColor : inkColor,
            letterSpacing: done ? '0.14em' : '-0.02em',
            lineHeight: 1,
            position: 'relative',
            // Each number arrives slightly oversized and settles within its second.
            scale: interpolate(withinSecond, [0, 0.16], [1.14, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              output: 'perceptual-scale',
            }),
          }}
        >
          {done ? finalWord : number}
        </Interactive.Div>
      </AbsoluteFill>

      {/* Cue punch, top-right — the little dot that tells the projectionist to change reel. */}
      {frame % fps < 3 ? (
        <div
          style={{
            position: 'absolute',
            right: '9%',
            top: '11%',
            width: 74,
            height: 74,
            borderRadius: '50%',
            backgroundColor: inkColor,
            opacity: 0.85,
          }}
        />
      ) : null}

      {/* Frame flash on the beat. */}
      <AbsoluteFill style={{backgroundColor: inkColor, opacity: punch * 0.1}} />

      {grain ? (
        <AbsoluteFill
          style={{
            opacity: 0.2,
            mixBlendMode: 'overlay',
            // Reseeded every frame, so the grain moves like real film stock.
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${
              Math.floor(random(`grain-${frame}`) * 100)
            }'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23g)'/%3E%3C/svg%3E")`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
