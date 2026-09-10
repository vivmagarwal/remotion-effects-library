import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Shader Blob
 * A custom GLSL material, which is the canonical safe way to animate in
 * Remotion's 3D. The shader never reads a clock: time arrives as a `uTime`
 * uniform computed from `useCurrentFrame()`. Contrast drei's MeshDistortMaterial
 * and MeshWobbleMaterial, which read `state.clock.elapsedTime` internally and
 * therefore cannot be used here at all.
 */

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uDetail;

  varying float vDisp;
  varying vec3 vNormal;
  varying vec3 vView;

  // Products of sines make soft overlapping lobes. Cheap, smooth, and — unlike
  // a hash-based noise — identical on every GPU, which matters when frames are
  // rendered across parallel browser instances.
  float lobes(vec3 p, float t) {
    return sin(p.x * 2.1 + t * 1.3) * sin(p.y * 1.7 - t * 1.1) * sin(p.z * 2.4 + t * 0.9);
  }

  void main() {
    float d = lobes(position, uTime) * 0.62
            + lobes(position * uDetail, uTime * 1.45) * 0.26;
    vDisp = d;

    vec3 displaced = position + normal * d * uAmplitude;

    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uRim;

  varying float vDisp;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    // Fresnel: surfaces facing away from the camera glow at the silhouette.
    // This one term is what makes an untextured blob read as a solid object.
    float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.6);
    vec3 base = mix(uColorA, uColorB, clamp(vDisp * 0.5 + 0.5, 0.0, 1.0));
    gl_FragColor = vec4(base + uRim * fres * 1.5, 1.0);
  }
`;

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bg: string;
  readonly bgDeep: string;
  readonly pair: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
  bgDeep: '#04050a',
  pair: '#4cc9f0',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  /** How far the surface is pushed along its normal. */
  readonly amplitude?: number;
  /** Frequency multiplier of the second octave. */
  readonly detail?: number;
  /** Icosahedron subdivision. Higher is smoother and heavier. */
  readonly segments?: number;
  readonly colorA?: string;
  readonly colorB?: string;
  readonly rimColor?: string;
  readonly backgroundColor?: string;
};

export const ShaderBlob: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'LIQUID',
  subtitle = 'uTime as a uniform, never a clock',
  amplitude = 0.3,
  detail = 2.35,
  segments = 40,
  colorA = theme.bg,
  colorB = theme.series[4],
  rimColor = theme.pair,
  backgroundColor = theme.bgDeep,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  const t = frame / fps;

  // A fresh uniforms object each frame. R3F assigns it straight onto the
  // material; the shader program is only recompiled when the shader SOURCE
  // changes, so this is cheap.
  const uniforms = useMemo(
    () => ({
      uTime: {value: t},
      uAmplitude: {value: amplitude},
      uDetail: {value: detail},
      uColorA: {value: new THREE.Color(colorA)},
      uColorB: {value: new THREE.Color(colorB)},
      uRim: {value: new THREE.Color(rimColor)},
    }),
    [t, amplitude, detail, colorA, colorB, rimColor],
  );

  const rise = interpolate(frame, [0, 44], [0.15, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor}}>
      <AbsoluteFill
        style={{backgroundImage: `radial-gradient(ellipse at 50% 48%, ${colorB}30 0%, transparent 60%)`}}
      />

      <ThreeCanvas
        width={width}
        height={height}
        camera={{position: [0, 0, 5.5], fov: 46}}
        style={{position: 'absolute', inset: 0}}
      >
        {/* Lifted so the overlay title has clear background beneath it. */}
        <mesh position={[0, 0.42, 0]} rotation={[t * 0.22, t * 0.36, 0]} scale={rise}>
          {/* An icosahedron subdivides into near-equilateral triangles, so a
              displaced surface has no pole pinching the way a sphere does. */}
          <icosahedronGeometry args={[1.35, segments]} />
          {/* The key forces a recompile if the shader text is ever edited. */}
          <shaderMaterial
            key="shader-blob"
            vertexShader={VERTEX}
            fragmentShader={FRAGMENT}
            uniforms={uniforms}
          />
        </mesh>
      </ThreeCanvas>

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
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: '0.28em',
            marginRight: '-0.28em',
            color: '#ffffff',
            textShadow: `0 0 70px ${rimColor}77`,
            opacity: interpolate(frame, [22, 48], [0, 1], {
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
            fontSize: 25,
            color: '#8d93a5',
            marginTop: 16,
            opacity: interpolate(frame, [36, 60], [0, 1], {
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
