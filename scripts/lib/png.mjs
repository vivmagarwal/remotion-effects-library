/**
 * A 60-line PNG reader, so the poster gate can look at pixels without adding
 * `sharp` (a native dependency) to a repo whose only build step is Vite.
 *
 * Handles what Remotion's renderStill actually writes: non-interlaced, 8-bit,
 * colour types 0/2/4/6. Anything else throws with a clear message rather than
 * returning wrong numbers.
 */
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

const CHANNELS = {0: 1, 2: 3, 4: 2, 6: 4};

export const decodePng = (path) => {
  const buf = readFileSync(path);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${path}: not a PNG`);

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  for (let p = 8; p + 8 <= buf.length; ) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error(`${path}: interlaced PNGs are not supported`);
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`${path}: bit depth ${bitDepth} is not supported (need 8)`);
  const ch = CHANNELS[colorType];
  if (!ch) throw new Error(`${path}: colour type ${colorType} is not supported`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const out = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }

  return {width, height, channels: ch, data: out};
};

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const LUT = Array.from({length: 256}, (_, i) => lin(i / 255));

/**
 * Relative luminance per pixel (Rec. 709 on linearised sRGB), plus the three
 * numbers the poster gate judges: mean, standard deviation, and the fraction of
 * pixels above L 0.25 ("ink").
 */
export const luminanceStats = (img) => {
  const {width, height, channels, data} = img;
  const n = width * height;
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * channels;
    y[i] =
      channels >= 3
        ? 0.2126 * LUT[data[o]] + 0.7152 * LUT[data[o + 1]] + 0.0722 * LUT[data[o + 2]]
        : LUT[data[o]];
  }
  let sum = 0;
  let ink = 0;
  for (let i = 0; i < n; i++) {
    sum += y[i];
    if (y[i] > 0.25) ink++;
  }
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (y[i] - mean) ** 2;

  // Mean absolute horizontal + vertical gradient — "is there structure".
  let edge = 0;
  for (let py = 1; py < height; py++) {
    for (let px = 1; px < width; px++) {
      const i = py * width + px;
      edge += Math.abs(y[i] - y[i - 1]) + Math.abs(y[i] - y[i - width]);
    }
  }

  return {
    mean,
    std: Math.sqrt(varSum / n),
    ink: ink / n,
    edge: edge / (2 * (width - 1) * (height - 1)),
    pixels: n,
  };
};
