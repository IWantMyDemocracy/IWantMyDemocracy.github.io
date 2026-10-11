// Adds colour choices ("colorways") to designs that come in several colours: copies each
// colour's artwork into the site and writes the list into the design's content file.
// Store links are matched by the colour names in the Redbubble and TeePublic listing titles;
// colours without a confident match fall back to the design's main store links.
// Usage: FAUBER_DESIGN_DIR=<Fauber Design folder> node scripts/seed/colorways.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SOURCE_ROOT = process.env.FAUBER_DESIGN_DIR ?? '';
if (!SOURCE_ROOT) throw new Error('Set FAUBER_DESIGN_DIR to the Fauber Design folder first.');

const root = fileURLToPath(new URL('../../', import.meta.url));
const rb = (id) => (id ? `https://www.redbubble.com/shop/ap/${id}` : '');
const tp = (idSlug) => (idSlug ? `https://www.teepublic.com/t-shirt/${idSlug}` : '');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// [colour name, artwork file (relative to the folder), Redbubble work id, TeePublic id-slug]
// The first colour is the design's main picture.
const sets = {
  'fight-fascism': {
    folder: 'Tshirts/Fight Fascism',
    colors: [
      ['Blue', 'Copperplate Blue.png', 172520344],
      ['Aqua', 'Copperplate Aqua.png', 172519988],
      ['Black', 'Copperplate Black.png', 172520312],
      ['Fuchsia', 'Copperplate Fuchsia.png', 172520435],
      ['Grape', 'Copperplate Grape.png', 172520474],
      ['Green', 'Copperplate Green.png', 172581207],
      ['Lime green', 'Copperplate Lime green.png', 172581236],
      ['Magenta', 'Copperplate Magenta.png', 172581260],
      ['Orange', 'Copperplate Orange.png', 172581281],
      ['Pink', 'Copperplate Pink.png', 172581304],
      ['Yellow', 'Copperplate Yellow.png', 172581322],
    ],
  },
  'fascism-sucks': {
    folder: 'Tshirts/Fascism Sucks',
    colors: [
      ['Blue', 'Nexa Rust worn/blue.png', 172590094, '79533612-fascism-sucks-blue'],
      ['Aqua', 'Nexa Rust worn/aqua.png', 172588255, '79529668-fascism-sucks-aquanexa'],
      ['Black', 'Nexa Rust worn/black.png', 172590050, '79533412-fascism-sucks-blk'],
      ['Black & grey', 'Nexa Rust worn/blk grey.png', 172590074, '79533573-fascism-sucks-dk-grey'],
      ['Brown', 'Nexa Rust worn/brown.png', 172590121, '79533699-fascism-sucks-brown'],
      ['Grape', 'Nexa Rust worn/grape.png', null, '79533777-fascism-sucks-grape'],
      ['Green', 'Nexa Rust worn/green.png', 172612690, '79533958-fascism-sucks-green'],
      ['Green two-tone', 'Nexa Rust worn/green tutone.png', 172612672],
      ['Green multi', 'Nexa Rust worn/green multi.png', 172590267],
      ['Lime green', 'Nexa Rust worn/lime green.png', 172612714, '79534458-fascism-sucks-lime'],
      ['Magenta', 'Nexa Rust worn/magneta.png', 172612743, '79535206-fascism-sucks-magenta'],
      ['Orange', 'Nexa Rust worn/orange.png', 172612768, '79539857-fascism-sucks-orange'],
      ['Orange & magenta', 'Nexa Rust worn/orange magenta.png', 172612758, '79535341-fascism-sucks-magenta-orange'],
      ['Pink', 'Nexa Rust worn/pink.png', 172612942, '79539904-fascism-sucks-pink'],
      ['Purple', 'Nexa Rust worn/purple.png', 172613011, '79540013-fascism-sucks-purple'],
      ['Starburst: red, white & blue', 'Fascism sucks red white blue.png', 172587587],
      ['Starburst: green & blue', 'Fascism sucks green blue.png', 172586546, '79555548-fascism-sucks-flower-bluegreens'],
      ['Starburst: green & fuchsia', 'Fascism sucks green fuchsia.png', 172586668, '79562591-fascism-sucks-flower-fuchsia-green-blue'],
      ['Starburst: green & grape', 'Fascism sucks green grape.png', 172587465, '79563445-fascism-sucks-flower-grape-blue-green'],
      ['Starburst: green & magenta', 'Fascism sucks green magenta.png', 172587494, '79563505-fascism-sucks-flower-magenta-blue-green'],
      ['Starburst: green & orange', 'Fascism sucks green orange.png', 172587520, '79563597-fascism-sucks-flower-orange-blue-greens'],
      ['Starburst: green & pink', 'Fascism sucks green pink.png', 172587538, '79563785-fascism-sucks-flower-pink-blue-greens'],
      ['Starburst: green & purple', 'Fascism sucks green purple.png', 172587557, '79563703-fascism-sucks-flower-purple-blue-greens'],
      ['Starburst: yellow & blue', 'Fascism sucks yellow blue.png', 172587620, '79563919-fascism-sucks-flower-yellow-orange-blue'],
      ['Starburst: yellow & fuchsia', 'Fascism sucks yellow fuschia.png', 172587643],
      ['Starburst: yellow & grape', 'Fascism sucks yellow grape.png', 172587672, '79615478-fascism-sucks-flower-yellow-orange-grape'],
      ['Starburst: yellow & green', 'Fascism sucks yellow green.png', 172587690, '79615634-fascism-sucks-flower-yellow-orange-green'],
      ['Starburst: yellow & magenta', 'Fascism sucks yellow magentaa.png', 172587703, '79631953-fascism-sucks-flower-yellow-orange-magenta'],
      ['Starburst: yellow & orange', 'Fascism sucks yellow orange.png', 172587729, '79631777-fascism-sucks-flower-yellow-orange'],
      ['Starburst: yellow & pink', 'Fascism sucks yellow pink.png', 172587771, '79632439-fascism-sucks-flower-yellow-orange-pink'],
      ['Starburst: yellow & purple', 'Fascism Sucks Yellow and purple.png', 172587602, '79563817-fascism-sucks-flower-yellow-orange-purple'],
    ],
  },
  'fight-oligarchy': {
    folder: 'Tshirts/Fight Oligarchy/Bubble and',
    colors: [
      ['Blue & orange', 'Fight Oligarchy bubble original blue orange.png', 172513998],
      ['Blue & lime green', 'Fight Oligarchy bubble original blue lime green 2.png'],
      ['Dark purple & orange', 'Fight Oligarchy bubble original dkr purple orange.png', 172513857],
      ['Fuchsia & orange', 'Fight Oligarchy bubble original fuchsia orange.png'],
      ['Green & orange', 'Fight Oligarchy bubble original green orange.png'],
      ['Light pink & green', 'Fight Oligarchy bubble original lt pink green.png'],
      ['Magenta, pink & green', 'Fight Oligarchy bubble original magenta pink green.png'],
      ['Orange & lime green', 'Fight Oligarchy bubble original orange lime green.png'],
      ['Pink & lime green', 'Fight Oligarchy bubble original pink lime green.png'],
      ['Purple & green', 'Fight Oligarchy bubble original purple green.png', 172513963],
      ['Purple & lime green', 'Fight Oligarchy bubble original purple lime green.png', 172513712],
      ['Purple & orange', 'Fight Oligarchy bubble original purple orange.png', 172517121],
    ],
  },
  'workers-over-billionaires': {
    folder: 'Tshirts/Workers over Billionaires/Nexa rust slab shadow',
    colors: [
      ['Blue', 'blue.png', 173052054, '79350012-workers-over-billionaires-blue'],
      ['Aqua', 'aqua.png'],
      ['Black', 'black.png', 173052039, '79350018-workers-over-billionaires-black'],
      ['Grey', 'grey.png', 173052080],
      ['Kelly green', 'kelly green.png', 173052093, '79350013-workers-over-billionaires-green'],
      ['Orange', 'orange.png', 173052109, '79350020-workers-over-billionaires-orange'],
      ['Pink', 'pink.png', 173052122, '79350019-workers-over-billionaires-pink'],
      ['Purple', 'purple.png', 173052139, '79350016-workers-over-billionaires-purple'],
      ['Raspberry', 'raspberry.png', 173052168],
      ['Teal', 'teal.png', 173052196],
      ['White', 'white.png', 173052379, '79350014-workers-over-billionaires-white'],
      ['Yellow', 'yellow.png', 173052216, '79350015-workers-over-billionaires-yellow'],
    ],
  },
  'workers-over-billionaires-pow': {
    folder: 'Tshirts/Workers over Billionaires/EDs Market',
    colors: [
      ['Blue & blue', 'Pow workers lime green blue blue.png', 173012580, '79398393-workers-over-billionaires-blue-blue-lime-green-pow'],
      ['Orange & blue', 'Pow workers lime green orange blue.png', 173028100, '79398392-blue-orange-workers-over-billionaires-lime-green-p'],
      ['Orange & purple', 'Pow workers lime green orange purple.png', 173028123, '79398390-purple-orange-workers-over-billionaires-lime-green'],
      ['Purples', 'Pow workers lime green purples.png', 173028168, '79398387-purple-workers-over-billionaires-lime-green-backgr'],
      ['White & blue', 'Pow workers lime green white blue.png', 173028210, '79398389-workers-over-billionaires-white-blue-lime-green-do'],
      ['White & purple', 'Pow workers lime green white purple.png', 173028241, '79398388-workers-over-billionaires-donkey-pow'],
      ['Yellow & blue', 'Pow workers lime green yellow blue.png', 173028272, '79398394-workers-over-billionaires-yellow-blue-donkey-lime-'],
      ['Yellow & purple', 'Pow workers lime green yellow purple.png', 173028304, '79398391-purple-yellow-workers-over-billionaires-lime-green'],
    ],
  },
};

sharp.cache(false);
const q = (s) => JSON.stringify(s);

for (const [design, { folder, colors }] of Object.entries(sets)) {
  const mdPath = path.join(root, 'src/content/designs', `${design}.md`);
  const md = await readFile(mdPath, 'utf8');
  const mainImage = md.match(/^image:\s*"?([^"\n]+)"?/m)?.[1];

  const items = [];
  for (const [i, [name, file, rbId, tpId]] of colors.entries()) {
    const src = path.join(SOURCE_ROOT, folder, file);
    if (!existsSync(src)) throw new Error(`Missing ${src}`);
    let image = mainImage;
    if (i > 0) {
      const outName = `${design}-${slug(name.replace(/^starburst:\s*/i, 'starburst '))}.png`;
      await sharp(src, { limitInputPixels: false })
        .trim({ threshold: 1 })
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(path.join(root, 'src/assets/designs', outName));
      image = `/src/assets/designs/${outName}`;
    }
    items.push([
      `  - name: ${q(name)}`,
      `    image: ${q(image)}`,
      `    redbubbleUrl: ${q(rb(rbId))}`,
      `    teepublicUrl: ${q(tp(tpId))}`,
    ].join('\n'));
  }

  // Replace any earlier colour list, then add the new one just before the closing ---.
  const [, front, rest] = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const cleaned = front.replace(/\ncolorways:\n(?:  [\s\S]*?)(?=\n\S|$)/, '');
  await writeFile(mdPath, `---\n${cleaned}\ncolorways:\n${items.join('\n')}\n---\n${rest}`);
  console.log(`${design}: ${colors.length} colours`);
}
