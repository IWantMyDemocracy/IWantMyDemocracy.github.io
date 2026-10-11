// Builds the 1200×630 preview pictures that Facebook, X, Bluesky and Threads show when a link is shared.
import sharp from 'sharp';
import path from 'node:path';

const W = 1200;
const H = 630;
const brand = (file: string) => path.join(process.cwd(), 'src/assets/brand', file);

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="g" cx="30%" cy="0%" r="120%">
      <stop offset="0" stop-color="#3a74f0"/><stop offset=".45" stop-color="#1d47cf"/><stop offset="1" stop-color="#0b1f4d"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect y="${H - 14}" width="${W / 3}" height="14" fill="#d62839"/>
  <rect x="${W / 3}" y="${H - 14}" width="${W / 3}" height="14" fill="#ffffff"/>
  <rect x="${(2 * W) / 3}" y="${H - 14}" width="${W / 3}" height="14" fill="#1838c8"/>
</svg>`);

const card = (size: number) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><radialGradient id="c" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eaf3fc"/></radialGradient></defs>
    <rect width="${size}" height="${size}" rx="28" fill="url(#c)"/>
  </svg>`);

const caption = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="60">
  <text x="0" y="40" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#ffffff">iwantmydemocracy.com</text>
</svg>`);

export async function designOgImage(designFile: string | null) {
  const cardSize = 560;
  const layers: sharp.OverlayOptions[] = [{ input: card(cardSize), left: 35, top: 28 }];
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
  return sharp(background).composite(layers).png({ compressionLevel: 9 }).toBuffer();
}

export async function defaultOgImage() {
  const logo = await sharp(brand('logo-on-blue.png')).resize({ width: 860 }).png().toBuffer();
  const donkey = await sharp(brand('donkey-on-blue.png')).resize({ height: 400 }).png().toBuffer();
  const meta = await sharp(logo).metadata();
  return sharp(background)
    .composite([
      { input: logo, left: 50, top: Math.round((H - 14 - (meta.height ?? 350)) / 2) },
      { input: donkey, left: 940, top: 150 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}
