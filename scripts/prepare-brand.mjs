// One-time helper: turns the original logo and donkey artwork into web-ready files.
// Run with:  node scripts/prepare-brand.mjs <logo.png> <donkey-render.png>
// The originals are only read, never changed.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const [logoPath, donkeyPath] = process.argv.slice(2);
if (!logoPath || !donkeyPath) {
  console.error('Usage: node scripts/prepare-brand.mjs <logo.png> <donkey.png>');
  process.exit(1);
}

const out = new URL('../src/assets/brand/', import.meta.url);
const pub = new URL('../public/', import.meta.url);
await mkdir(out, { recursive: true });
await mkdir(pub, { recursive: true });

sharp.cache(false);
sharp.concurrency(1);

/**
 * Returns a mask of the see-through spaces enclosed by the shape (the inside of the D, the
 * hooks of the c's, the space above the y's swash): pixels that can't be reached from the
 * image border without crossing the shape.
 */
function enclosedMask(mask, w, h) {
  const outside = new Uint8Array(w * h);
  const stack = [];
  const visit = (i) => {
    if (!outside[i] && mask[i] < 255) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) visit(x), visit((h - 1) * w + x);
  for (let y = 0; y < h; y++) visit(y * w), visit(y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    if (x > 0) visit(i - 1);
    if (x < w - 1) visit(i + 1);
    if (i >= w) visit(i - w);
    if (i < w * (h - 1)) visit(i + w);
  }
  const enclosed = Buffer.alloc(w * h);
  for (let i = 0; i < enclosed.length; i++) {
    if (!outside[i] && mask[i] < 255) enclosed[i] = 255;
  }
  return enclosed;
}

/**
 * Adds a solid white outline around everything that isn't transparent. With `holeColor`, the
 * enclosed see-through spaces get that colour, so they look the same on any background.
 */
async function withWhiteEdge(input, radius, { holeColor } = {}) {
  const { width, height } = await sharp(input).metadata();
  const pad = radius * 2;
  const padded = await sharp(input)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Grow the shape: blur its alpha channel, then keep everything that got even slightly covered.
  // (Blur and threshold run as separate steps because sharp applies threshold before blur within one pipeline.)
  const w = width + pad * 2;
  const h = height + pad * 2;
  const blurred = await sharp(padded).extractChannel('alpha').blur(radius / 2).raw().toBuffer();
  const grown = Buffer.alloc(blurred.length);
  for (let i = 0; i < blurred.length; i++) {
    // Hard edge with a 1-step soft rim so the outline isn't jagged.
    const v = blurred[i];
    grown[i] = v >= 24 ? 255 : v <= 8 ? 0 : Math.round(((v - 8) / 16) * 255);
  }
  const layer = (color, alpha) =>
    sharp({ create: { width: w, height: h, channels: 3, background: color } })
      .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } })
      .png()
      .toBuffer();

  const white = await layer('#ffffff', grown);
  if (!holeColor) return sharp(white).composite([{ input: padded }]).png();

  const holes = await layer(holeColor, enclosedMask(grown, w, h));
  return sharp(holes).composite([{ input: white }, { input: padded }]).png();
}

// ---- Logo -------------------------------------------------------------
const logo = await sharp(logoPath).trim().resize({ width: 2400 }).png().toBuffer();
await sharp(logo).png({ compressionLevel: 9 }).toFile(new URL('logo.png', out).pathname.slice(1));
// Medium blue for the enclosed spaces: lighter than the dark page background, darker than the letters.
await (await withWhiteEdge(logo, 18, { holeColor: '#3b6ef0' })).toFile(new URL('logo-on-blue.png', out).pathname.slice(1));
console.log('logo.png, logo-on-blue.png');

// ---- Donkey -----------------------------------------------------------
const donkeyFull = await sharp(donkeyPath, { limitInputPixels: false })
  .trim({ threshold: 10 })
  .png()
  .toBuffer();
const donkey = await sharp(donkeyFull).resize({ height: 1400 }).png({ compressionLevel: 9 }).toBuffer();
await sharp(donkey).toFile(new URL('donkey.png', out).pathname.slice(1));
await (await withWhiteEdge(donkey, 14)).toFile(new URL('donkey-on-blue.png', out).pathname.slice(1));
const dm = await sharp(donkey).metadata();
console.log(`donkey.png ${dm.width}x${dm.height}`);

// ---- Site icon: donkey head on a navy rounded square ------------------------
const headSize = Math.round(dm.width * 1.0);
const head = await sharp(donkey)
  .extract({ left: 0, top: 0, width: dm.width, height: Math.min(dm.height, Math.round(headSize * 1.05)) })
  .resize({ width: 400, height: 400, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
const tile = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="96" fill="#0B1F4D"/></svg>`
);
const icon = await sharp(tile)
  .composite([{ input: head, top: 56, left: 56 }])
  .png()
  .toBuffer();
await sharp(icon).toFile(new URL('icon-512.png', pub).pathname.slice(1));
await sharp(icon).resize(180).toFile(new URL('apple-touch-icon.png', pub).pathname.slice(1));
await sharp(icon).resize(48).toFile(new URL('favicon.png', pub).pathname.slice(1));
console.log('icons');
