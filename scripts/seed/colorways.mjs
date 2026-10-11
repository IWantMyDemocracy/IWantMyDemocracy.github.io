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
const isUrl = (v) => typeof v === 'string' && v.startsWith('http');
const rb = (id) => (isUrl(id) ? id : id ? `https://www.redbubble.com/shop/ap/${id}` : '');
const tp = (idSlug) => (isUrl(idSlug) ? idSlug : idSlug ? `https://www.teepublic.com/t-shirt/${idSlug}` : '');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Colours that aren't listed in a store yet point to the WOKE collection / album instead.
const RB_WOKE = 'https://www.redbubble.com/people/fauberdesign/shop?asc=u&collections=4254682';
const TP_WOKE = 'https://www.teepublic.com/user/i-want-my-democracy/albums/459059-woke';

// [colour name, artwork file (relative to the folder), Redbubble work id or URL, TeePublic id-slug or URL]
// The first colour is the design's main picture. A design with a single entry only gets its
// picture copied (no colour list).
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
    ],
  },
  'fascism-sucks-starburst': {
    folder: 'Tshirts/Fascism Sucks',
    colors: [
      ['Red, white & blue', 'Fascism sucks red white blue.png', 172587587],
      ['Green & blue', 'Fascism sucks green blue.png', 172586546, '79555548-fascism-sucks-flower-bluegreens'],
      ['Green & fuchsia', 'Fascism sucks green fuchsia.png', 172586668, '79562591-fascism-sucks-flower-fuchsia-green-blue'],
      ['Green & grape', 'Fascism sucks green grape.png', 172587465, '79563445-fascism-sucks-flower-grape-blue-green'],
      ['Green & magenta', 'Fascism sucks green magenta.png', 172587494, '79563505-fascism-sucks-flower-magenta-blue-green'],
      ['Green & orange', 'Fascism sucks green orange.png', 172587520, '79563597-fascism-sucks-flower-orange-blue-greens'],
      ['Green & pink', 'Fascism sucks green pink.png', 172587538, '79563785-fascism-sucks-flower-pink-blue-greens'],
      ['Green & purple', 'Fascism sucks green purple.png', 172587557, '79563703-fascism-sucks-flower-purple-blue-greens'],
      ['Yellow & blue', 'Fascism sucks yellow blue.png', 172587620, '79563919-fascism-sucks-flower-yellow-orange-blue'],
      ['Yellow & fuchsia', 'Fascism sucks yellow fuschia.png', 172587643],
      ['Yellow & grape', 'Fascism sucks yellow grape.png', 172587672, '79615478-fascism-sucks-flower-yellow-orange-grape'],
      ['Yellow & green', 'Fascism sucks yellow green.png', 172587690, '79615634-fascism-sucks-flower-yellow-orange-green'],
      ['Yellow & magenta', 'Fascism sucks yellow magentaa.png', 172587703, '79631953-fascism-sucks-flower-yellow-orange-magenta'],
      ['Yellow & orange', 'Fascism sucks yellow orange.png', 172587729, '79631777-fascism-sucks-flower-yellow-orange'],
      ['Yellow & pink', 'Fascism sucks yellow pink.png', 172587771, '79632439-fascism-sucks-flower-yellow-orange-pink'],
      ['Yellow & purple', 'Fascism Sucks Yellow and purple.png', 172587602, '79563817-fascism-sucks-flower-yellow-orange-purple'],
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
  'vote-democracy-is-people-powered': {
    folder: 'Tshirts/Vote deomcracy is people powered',
    colors: [
      ['White letters', 'Vote Democracy is people powered WH dk trim 3 pt.png', 164419003, '64604241-vote-democracy-is-people-powered'],
      ['Black letters', 'Vote Democracy is people powered DK wh trim 3 pt.png', 164418038, '64603732-vote-democracy-is-people-powered'],
    ],
  },
  // WOKE aka Caring About Others: one design per font.
  'woke-caring-about-others': {
    folder: 'Tshirts/WOKE Caring about others/Modesto Expanded',
    colors: [
      ['Light blue & dark blue', 'Blue Base glow under frame woke caring about others light blue dk blue trim.png', RB_WOKE, '74440638-woke-is-caring-about-others-light-blue'],
      ['Navy & green', 'Blue Base glow under frame woke caring about others light blue final.png', 170066550, '74420250-woke-aka-caring-about-others'],
    ],
  },
  'woke-caring-about-others-serif': {
    folder: 'Tshirts/WOKE Caring about others/Amster',
    colors: [
      ['Light blue & dark blue', 'Blue Base glow under frame woke caring about others light blue dk blue trim.png', 170066767, '74416587-woke-aka-caring-about-others-carolina-blue'],
      ['Navy & green', 'Blue Base glow under frame woke caring about others light blue final.png', RB_WOKE, TP_WOKE],
    ],
  },
  'woke-caring-about-others-comic': {
    folder: 'Tshirts',
    colors: [
      ['Green & white', 'WOKE Caring about others/Blambot Pro BB Regular/WOKE caring about others Blambot green white trim.png', 170067109, '74394495-woke-aka-caring-about-others-brat-white-trim'],
      ['Navy & green', 'WOKE Caring about others/Blambot Pro BB Regular/WOKE caring about others Blambot final.png', RB_WOKE, TP_WOKE],
      ['Light blue & blue', 'WOKE Having empathy/Blambot Pro Reg/WOKE caring about others blue and blue.png', RB_WOKE, TP_WOKE],
    ],
  },
  'woke-caring-about-others-rounded': {
    folder: 'Tshirts/WOKE Caring about others/Hobieux',
    colors: [
      ['Pink & white', 'Hobieux Blue Base glow under frame woke caring about others pink white trim.png', 170043738, '74417130-woke-aka-caring-about-others-hp'],
      ['Navy & green', 'Hobieux Blue Base glow under frame woke caring about others light blue final.png', RB_WOKE, TP_WOKE],
    ],
  },
  // WOKE aka Having Empathy: one design per font.
  'woke-having-empathy': {
    folder: 'Tshirts/WOKE Having empathy/Modesto Expanded version',
    colors: [
      ['Light blue & blue', 'WOKE having empathy final modesto expanded final blue on blue.png', 170043124, '74442312-woke-aka-having-empathy-carolina-blue'],
      ['Navy & green', 'WOKE having empathy final modesto expanded final.png', RB_WOKE, TP_WOKE],
    ],
  },
  'woke-having-empathy-serif': {
    folder: 'Tshirts/WOKE Having empathy/Amster',
    colors: [['Navy & green', 'WOKE having empathy no background lighter blue (1) final copy.png', 170042605, '74441503-woke-aka-having-empathy']],
  },
  'woke-having-empathy-comic': {
    folder: 'Tshirts/WOKE Having empathy/Blambot Pro Reg',
    colors: [
      ['Pink & white', 'WOKE having empathy final pink white trim.png', 170043429, '74441820-woke-aka-having-empathy-hot-pink'],
      ['Navy & green', 'WOKE having empathy final.png', RB_WOKE, TP_WOKE],
    ],
  },
  'woke-having-empathy-rounded': {
    folder: 'Tshirts/WOKE Having empathy/Hobieux Bold',
    colors: [['Navy & lime green', 'WOKE having empathy blue lime green trim final.png', 170042278, '74442085-woke-aka-having-empathy']],
  },
};

async function copyArtwork(src, outName) {
  await sharp(src, { limitInputPixels: false })
    .trim({ threshold: 1 })
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(root, 'src/assets/designs', outName));
}

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
      const outName = `${design}-${slug(name)}.png`;
      await copyArtwork(src, outName);
      image = `/src/assets/designs/${outName}`;
    } else if (!existsSync(path.join(root, mainImage.replace(/^\//, '')))) {
      // New design: its main picture is the first colour's artwork.
      await copyArtwork(src, path.basename(mainImage));
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
  const list = colors.length > 1 ? `\ncolorways:\n${items.join('\n')}` : '';
  await writeFile(mdPath, `---\n${cleaned}${list}\n---\n${rest}`);
  console.log(`${design}: ${colors.length} colours`);
}
