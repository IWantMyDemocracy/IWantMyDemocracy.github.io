// Builds the 1200×630 preview pictures that Facebook, X, Bluesky and Threads show when a link is
// shared. Saved as JPEG: about five times smaller than PNG for these photo-like pictures.
import sharp, { type OverlayOptions, type Sharp } from 'sharp';
import path from 'node:path';

const W = 1200;
const H = 630;
const brand = (file: string) => path.join(process.cwd(), 'src/assets/brand', file);

// The same colours as the variables in src/styles/global.css (SVG drawn here can't read CSS).
const color = {
  heroTop: '#3a74f0',
  heroMid: '#1d47cf',
  navy: '#0b1f4d',
  royal: '#1838c8',
  red: '#d62839',
  white: '#ffffff',
  tint: '#eaf3fc',
};

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="g" cx="30%" cy="0%" r="120%">
      <stop offset="0" stop-color="${color.heroTop}"/><stop offset=".45" stop-color="${color.heroMid}"/><stop offset="1" stop-color="${color.navy}"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect y="${H - 14}" width="${W / 3}" height="14" fill="${color.red}"/>
  <rect x="${W / 3}" y="${H - 14}" width="${W / 3}" height="14" fill="${color.white}"/>
  <rect x="${(2 * W) / 3}" y="${H - 14}" width="${W / 3}" height="14" fill="${color.royal}"/>
</svg>`);

const card = (size: number) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><radialGradient id="c" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="${color.white}"/><stop offset="1" stop-color="${color.tint}"/></radialGradient></defs>
    <rect width="${size}" height="${size}" rx="28" fill="url(#c)"/>
  </svg>`);

const caption = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="60">
  <text x="0" y="40" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="${color.white}">iwantmydemocracy.com</text>
</svg>`);

const toJpeg = (img: Sharp) => img.flatten({ background: color.navy }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();

export async function designOgImage(designFile: string | null) {
  const cardSize = 560;
  const layers: OverlayOptions[] = [{ input: card(cardSize), left: 35, top: 28 }];
  if (designFile) {
    const art = await sharp(designFile, { limitInputPixels: false })
      .resize(cardSize - 70, cardSize - 70, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    layers.push({ input: art, left: 35 + 35, top: 28 + 35 });
  }
  const logo = await sharp(brand('logo-on-blue.png')).resize({ width: 540 }).png().toBuffer();
  const donkey = await sharp(brand('donkey-on-blue.png')).resize({ height: 250 }).png().toBuffer();
  layers.push({ input: logo, left: 630, top: 60 });
  layers.push({ input: caption, left: 650, top: 330 });
  layers.push({ input: donkey, left: 1030, top: 340 });
  return toJpeg(sharp(background).composite(layers));
}

export async function defaultOgImage() {
  const logo = await sharp(brand('logo-on-blue.png')).resize({ width: 860 }).png().toBuffer();
  const donkey = await sharp(brand('donkey-on-blue.png')).resize({ height: 400 }).png().toBuffer();
  const meta = await sharp(logo).metadata();
  return toJpeg(
    sharp(background).composite([
      { input: logo, left: 50, top: Math.round((H - 14 - (meta.height ?? 350)) / 2) },
      { input: donkey, left: 940, top: 150 },
    ])
  );
}
