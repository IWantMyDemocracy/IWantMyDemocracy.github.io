// One-time seed: copies each design's artwork into the site (resized for the web) and writes
// one content file per design and per cause, plus design-checklist.html for review.
// Usage: FAUBER_DESIGN_DIR=<Fauber Design folder> node scripts/seed/seed.mjs
// The original files in OneDrive are only read, never changed.
import sharp from 'sharp';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { causes, designs, SOURCE_ROOT } from './designs.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const assetsDir = path.join(root, 'src/assets/designs');
const designsDir = path.join(root, 'src/content/designs');
const causesDir = path.join(root, 'src/content/causes');
await mkdir(assetsDir, { recursive: true });
await mkdir(designsDir, { recursive: true });
await mkdir(causesDir, { recursive: true });

sharp.cache(false);

const q = (s) => JSON.stringify(s);
const day = (d) => d.toISOString().slice(0, 10);

for (const c of causes) {
  const lines = [
    '---',
    `name: ${q(c.name)}`,
    `description: ${q(c.description)}`,
    `order: ${c.order}`,
    `redbubbleCollection: ${q(c.redbubbleCollection ?? '')}`,
    `teepublicAlbum: ${q(c.teepublicAlbum ?? '')}`,
    'hidden: false',
    '---',
    '',
  ];
  await writeFile(path.join(causesDir, `${c.slug}.md`), lines.join('\n'));
}
console.log(`${causes.length} causes written`);

const rows = [];
for (const d of designs) {
  const src = `${SOURCE_ROOT}/${d.src}`;
  if (!existsSync(src)) throw new Error(`Missing source for ${d.slug}: ${src}`);

  const isPhoto = /\.(jpe?g)$/i.test(src) || d.src.includes('Pictures of products');
  const ext = isPhoto ? 'jpg' : 'png';
  const outFile = path.join(assetsDir, `${d.slug}.${ext}`);

  let img = sharp(src, { limitInputPixels: false });
  if (!isPhoto) img = img.trim({ threshold: 1 });
  img = img.resize(1400, 1400, { fit: 'inside', withoutEnlargement: true });
  if (isPhoto) await img.flatten({ background: '#ffffff' }).jpeg({ quality: 86, mozjpeg: true }).toFile(outFile);
  else await img.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(outFile);

  const added = (await stat(src)).mtime;
  const lines = [
    '---',
    `title: ${q(d.title)}`,
    `image: ${q(`/src/assets/designs/${d.slug}.${ext}`)}`,
    'causes:',
    ...d.causes.map((c) => `  - ${q(`src/content/causes/${c}.md`)}`),
    `redbubbleUrl: ${q(d.redbubble ?? '')}`,
    `teepublicUrl: ${q(d.teepublic ?? '')}`,
    `description: ${q(d.description ?? '')}`,
    `featured: ${d.featured ? 'true' : 'false'}`,
    'hidden: false',
    `dateAdded: ${day(added)}`,
    '---',
    '',
  ];
  await writeFile(path.join(designsDir, `${d.slug}.md`), lines.join('\n'));

  const thumb = await sharp(outFile).resize(160, 160, { fit: 'inside' }).flatten({ background: '#eef3fb' }).jpeg({ quality: 70 }).toBuffer();
  rows.push({ d, src, thumb: `data:image/jpeg;base64,${thumb.toString('base64')}`, added: day(added) });
  process.stdout.write('.');
}
console.log(`\n${designs.length} designs written`);

// ---- Review checklist ---------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const causeName = Object.fromEntries(causes.map((c) => [c.slug, c.name]));
const link = (url, label) => (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${label}</a>` : '<span class="none">none</span>');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Design checklist</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; color: #0b1f4d; background: #fff; }
  h1 { margin: 0 0 4px; } p { margin: 0 0 16px; color: #33456e; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border-bottom: 1px solid #d6dff0; padding: 8px; text-align: left; vertical-align: top; font-size: 14px; }
  th { background: #0b1f4d; color: #fff; position: sticky; top: 0; }
  img { width: 110px; height: 110px; object-fit: contain; background: #eef3fb; border-radius: 6px; }
  code { font-size: 12px; word-break: break-all; color: #33456e; }
  .none { color: #999; }
  tr:nth-child(even) td { background: #f6f9fe; }
</style></head><body>
<h1>Design checklist</h1>
<p>${designs.length} designs loaded into the website. The "Artwork file" column shows which file in your Fauber Design folder each picture came from.
If a newer version exists, open that design in the editor and click <b>Replace picture</b>.</p>
<table><thead><tr><th>#</th><th>Picture</th><th>Design</th><th>Causes</th><th>Store links</th><th>Artwork file</th></tr></thead><tbody>
${rows
  .map(
    (r, i) => `<tr><td>${i + 1}</td><td><img src="${r.thumb}" alt=""></td><td><b>${esc(r.d.title)}</b>${r.d.featured ? '<br>★ Featured on home page' : ''}</td>
<td>${r.d.causes.map((c) => esc(causeName[c])).join('<br>')}</td>
<td>${link(r.d.redbubble, 'Redbubble')}<br>${link(r.d.teepublic, 'TeePublic')}</td>
<td><code>${esc(r.d.src)}</code><br><small>saved ${r.added}</small></td></tr>`
  )
  .join('\n')}
</tbody></table></body></html>`;
await writeFile(path.join(root, 'design-checklist.html'), html);
console.log('design-checklist.html written');
