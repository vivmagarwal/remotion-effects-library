Build a Remotion composition called **ShaderBlob**: a liquid-metal sphere breathing under a custom
GLSL material.

**Setup**

```bash
npx remotion add @remotion/three
npm i three @react-three/fiber
npm i -D @types/three
```

**Why a custom shader, specifically**
This is the canonical safe way to animate 3D in Remotion. `useFrame()` is forbidden, and that
forbids more than you'd expect: **drei's `MeshDistortMaterial` and `MeshWobbleMaterial` both do
`useFrame((s) => material.time = s.clock.elapsedTime * speed)` internally**, and Remotion sets
`clock.elapsedTime` to `performance.now()` in milliseconds. There is no prop that fixes this —
`speed={0}` just pins time to 0 and freezes the effect. Write your own material, and pass time in
as a uniform.

**The vertex shader**

```glsl
uniform float uTime;
uniform float uAmplitude;
uniform float uDetail;

varying float vDisp;
varying vec3  vNormal;
varying vec3  vView;

// Products of sines make soft overlapping lobes. Cheap, smooth, and — unlike a
// hash-based noise — bit-identical on every GPU, which matters when frames are
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
  vView   = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
```

**The fragment shader — one term does all the work**

```glsl
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uRim;

varying float vDisp;
varying vec3  vNormal;
varying vec3  vView;

void main() {
  // Fresnel: surfaces facing away from the camera glow at the silhouette. This
  // single term is what makes an untextured blob read as a solid object.
  float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.6);
  vec3 base = mix(uColorA, uColorB, clamp(vDisp * 0.5 + 0.5, 0.0, 1.0));
  gl_FragColor = vec4(base + uRim * fres * 1.5, 1.0);
}
```

**Wiring time in**

```tsx
const t = frame / fps;

// A fresh uniforms object each frame. R3F assigns it straight onto the material;
// the shader PROGRAM is only recompiled when the shader SOURCE changes, so this
// is cheap.
const uniforms = useMemo(() => ({
  uTime:      {value: t},
  uAmplitude: {value: amplitude},
  uDetail:    {value: detail},
  uColorA:    {value: new THREE.Color(colorA)},
  uColorB:    {value: new THREE.Color(colorB)},
  uRim:       {value: new THREE.Color(rimColor)},
}), [t, amplitude, detail, colorA, colorB, rimColor]);

<mesh rotation={[t * 0.22, t * 0.36, 0]} scale={rise}>
  {/* An icosahedron subdivides into near-equilateral triangles, so a displaced
      surface has no pole pinching the way a UV sphere does. */}
  <icosahedronGeometry args={[1.35, segments]} />
  <shaderMaterial
    key="shader-blob"          {/* forces a recompile if the source is edited */}
    vertexShader={VERTEX}
    fragmentShader={FRAGMENT}
    uniforms={uniforms}
  />
</mesh>
```

Note there are **no lights** in this scene — a `ShaderMaterial` is unlit by definition, and the
fresnel rim replaces them. `rise` interpolates `0.15 → 1` over frames 0–44 on
`Easing.bezier(0.16, 1, 0.3, 1)`.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `#050410`, with a
  `radial-gradient(ellipse at 50% 48%, <colorB>30 0%, transparent 60%)` behind the canvas.
- `<ThreeCanvas>` needs explicit `width`/`height` from `useVideoConfig()`.
  Camera `{position: [0, 0, 5.5], fov: 46}`.

**The overlay**
Bottom-centred, `pointerEvents: 'none'`: Sora 104px weight 700, `letter-spacing: 0.28em` with a
matching negative `margin-right`, `textShadow: '0 0 70px <rimColor>77'`; monospace subtitle below.

**Requirements**
- One self-contained `.tsx` file exporting `ShaderBlob`.
- Props: `title`, `subtitle`, `amplitude` (0.3), `detail` (2.35), `segments` (40), `colorA`
  (`#1b0b4d`), `colorB` (`#8b4dff`), `rimColor` (`#57f0ff`), `backgroundColor`.
- Load Sora via `@remotion/google-fonts/Sora`.
- Set `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or pass `--gl=angle`.
