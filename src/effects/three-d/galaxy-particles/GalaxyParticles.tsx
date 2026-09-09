import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Galaxy Particles
 * Thirty thousand points arranged into spiral arms. The whole cloud is built
 * once in a `useMemo` from `random(seed)` — never `Math.random()`, because
 * Remotion hands frames to parallel browser tabs and an unseeded draw would
 * give every frame a different galaxy. Only the group's rotation depends on the
 * frame, so the stars themselves never move relative to each other.
 */

type Props = {
  readonly title?: string;
  readonly subtitle?: string;
  readonly count?: number;
  readonly branches?: number;
  readonly radius?: number;
  /** Radians of twist per unit of radius. This is what makes it a spiral. */
  readonly spin?: number;
  /** How far a star may stray from its arm, as a fraction of its radius. */
  readonly randomness?: number;
  readonly insideColor?: string;
  readonly outsideColor?: string;
  readonly backgroundColor?: string;
};

const Galaxy: React.FC<{
  count: number;
  branches: number;
  radius: number;
  spin: number;
  randomness: number;
  insideColor: string;
  outsideColor: string;
}> = ({count, branches, radius, spin, randomness, insideColor, outsideColor}) => {
  // Built once. Deterministic, so every parallel render tab agrees.
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cIn = new THREE.Color(insideColor);
    const cOut = new THREE.Color(outsideColor);
    const mixed = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Raising to a power > 1 biases stars inward, which is what gives the
      // galaxy a bright dense core instead of an evenly grey disc.
      const r = Math.pow(random(`r-${i}`), 1.6) * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin;

      // Cubing the scatter clusters stars tight against the arm and lets a few
      // stragglers drift far out. A flat random offset just blurs the arms away.
      const stray = (key: string, scale: number) => {
        const sign = random(`s-${key}`) < 0.5 ? 1 : -1;
        return Math.pow(random(key), 3) * sign * randomness * r * scale;
      };

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + stray(`x-${i}`, 1);
      positions[i3 + 1] = stray(`y-${i}`, 0.32);
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + stray(`z-${i}`, 1);

      // The ramp is biased inward (power < 1) so the cold colour reaches the
      // core region. A linear ramp leaves the whole visible galaxy warm.
      mixed.copy(cIn).lerp(cOut, Math.pow(Math.min(1, r / radius), 0.55));
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count, branches, radius, spin, randomness, insideColor, outsideColor]);

  return (
    <points geometry={geometry}>
      {/* Additive blending is what makes the core glow: where points overlap the
          colours sum toward white. depthWrite must be off or the points punch
          holes in each other. */}
      <pointsMaterial
        size={0.034}
        sizeAttenuation
        vertexColors
        transparent
        // Each point contributes only ~60%, so it takes real overlap to reach
        // white. At full opacity the core saturates and the galaxy is grey.
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const GalaxyParticles: React.FC<Props> = ({
  title = 'ANDROMEDA',
  subtitle = '30,000 points · one seeded buffer',
  count = 30000,
  branches = 5,
  radius = 5.2,
  spin = 0.72,
  randomness = 0.34,
  insideColor = '#ffb03a',
  outsideColor = '#3d6bff',
  backgroundColor = '#03030a',
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  // The camera stays put; the galaxy tips and turns beneath it.
  const tilt = interpolate(frame, [0, 130], [1.32, 0.42], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.32, 1),
  });
  const spinY = frame * 0.0042;
  const scaleIn = interpolate(frame, [0, 48], [0.55, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor}}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{position: [0, 3.4, 7.2], fov: 52}}
        style={{position: 'absolute', inset: 0}}
      >
        <group rotation={[tilt, spinY, 0]} scale={scaleIn}>
          <Galaxy
            count={count}
            branches={branches}
            radius={radius}
            spin={spin}
            randomness={randomness}
            insideColor={insideColor}
            outsideColor={outsideColor}
          />
        </group>
      </ThreeCanvas>

      {/* A DOM glow over the canvas. Cheaper and more controllable than a bloom
          pass, and it keeps the render deterministic. */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle at 50% 46%, ${insideColor}2e 0%, transparent 42%)`,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 92,
          fontFamily,
          pointerEvents: 'none',
        }}
      >
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 100,
            fontWeight: 700,
            letterSpacing: '0.3em',
            marginRight: '-0.3em',
            color: '#f6f2ff',
            textShadow: `0 0 70px ${outsideColor}aa`,
            opacity: interpolate(frame, [26, 52], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="Subtitle"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 26,
            letterSpacing: '0.18em',
            marginRight: '-0.18em',
            color: '#b9bfe8',
            marginTop: 22,
            opacity: interpolate(frame, [40, 66], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {subtitle}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
