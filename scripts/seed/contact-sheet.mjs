// Makes one picture showing every seed design with its slug, for a quick visual check.
// Usage: node scripts/seed/contact-sheet.mjs <output.png>
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { designs, SOURCE_ROOT } from './designs.mjs';

const out = process.argv[2];
const tile = 240;
const label = 36;
const cols = 7;
const rows = Math.ceil(designs.length / cols);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const composites = [];
for (const [i, d] of designs.entries()) {
  const x = (i % cols) * tile;
  const y = Math.floor(i / cols) * (tile + label);
  const file = `${SOURCE_ROOT}/${d.src}`;
  if (existsSync(file)) {
    const img = await sharp(file, { limitInputPixels: false })
      .resize(tile - 10, tile - 10, { fit: 'contain', background: { r: 200, g: 210, b: 230, alpha: 1 } })
      .flatten({ background: '#c8d2e6' })
      .png()
      .toBuffer();
    composites.push({ input: img, left: x + 5, top: y + 5 });
  }
  const text = Buffer.from(
    `<svg width="${tile}" height="${label}" xmlns="http://www.w3.org/2000/svg"><text x="4" y="14" font-size="12" font-family="Arial" fill="${existsSync(file) ? '#000' : '#c00'}">${i + 1}. ${esc(d.slug.slice(0, 34))}</text></svg>`
  );
  composites.push({ input: text, left: x, top: y + tile });
}

await sharp({ create: { width: cols * tile, height: rows * (tile + label), channels: 3, background: '#ffffff' } })
  .composite(composites)
  .png()
  .toFile(out);
console.log('saved', out);
