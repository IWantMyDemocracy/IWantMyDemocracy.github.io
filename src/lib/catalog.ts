import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import settings from '../data/settings.json';
import donkey from '../assets/brand/donkey.png';

// Every picture in src/assets/designs, keyed by file name. The editor may store a picture
// as "/src/assets/designs/x.png" or "../../assets/designs/x.png"; only the file name matters.
const designImages = import.meta.glob<{ default: ImageMetadata }>('../assets/designs/*.{png,jpg,jpeg,webp,gif,avif}', {
  eager: true,
});
const imagesByName = new Map(
  Object.entries(designImages).map(([file, mod]) => [baseName(file).toLowerCase(), mod.default])
);

function baseName(p: string) {
  return decodeURIComponent(p.split(/[\\/]/).pop() ?? '');
}

/**
 * Turns a cause file or reference ("src/content/causes/vote.md", "vote.md" or "vote") into a
 * comparable key. Both the cause's own file path and the design's reference go through this.
 */
function causeKey(ref: string) {
  return baseName(ref)
    .replace(/\.mdx?$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function imageFor(stored: string | undefined): ImageMetadata {
  if (!stored) return donkey;
  return imagesByName.get(baseName(stored).toLowerCase()) ?? donkey;
}

/** Disk path of a design picture, for build-time image generation. */
export function imageFileName(stored: string | undefined) {
  const name = stored ? baseName(stored) : '';
  return name && imagesByName.has(name.toLowerCase()) ? name : null;
}

export type Cause = {
  /** URL slug, e.g. "vote" in /causes/vote */
  id: string;
  key: string;
  name: string;
  description: string;
  order: number;
  cover?: ImageMetadata;
  redbubbleCollection: string;
  teepublicAlbum: string;
};

export type Colorway = {
  name: string;
  image: ImageMetadata;
  redbubbleUrl: string;
  teepublicUrl: string;
};

export type Design = {
  id: string;
  title: string;
  image: ImageMetadata;
  imageFile: string | null;
  causeKeys: string[];
  redbubbleUrl: string;
  teepublicUrl: string;
  description: string;
  featured: boolean;
  /** Optional manual order: lower numbers show first; designs without one follow, newest first. */
  position: number | null;
  dateAdded: Date | null;
  /** Colour choices; the first is usually the main picture. Empty for single-colour designs. */
  colorways: Colorway[];
};

const isUrl = (s: string) => /^https?:\/\//i.test(s);

export async function getCauses(): Promise<Cause[]> {
  const entries = await getCollection('causes', ({ data }) => !data.hidden);
  return entries
    .map(({ id, filePath, data }) => ({
      id,
      key: causeKey(filePath ?? id),
      name: data.name,
      description: data.description,
      order: data.order,
      cover: data.cover ? imageFor(data.cover) : undefined,
      redbubbleCollection: isUrl(data.redbubbleCollection) ? data.redbubbleCollection : '',
      teepublicAlbum: isUrl(data.teepublicAlbum) ? data.teepublicAlbum : '',
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getDesigns(): Promise<Design[]> {
  const entries = await getCollection('designs', ({ data }) => !data.hidden);
  return entries
    .map(({ id, data }) => ({
      id,
      title: data.title,
      image: imageFor(data.image),
      imageFile: imageFileName(data.image),
      causeKeys: data.causes.map(causeKey),
      redbubbleUrl: isUrl(data.redbubbleUrl) ? data.redbubbleUrl : '',
      teepublicUrl: isUrl(data.teepublicUrl) ? data.teepublicUrl : '',
      description: data.description,
      featured: data.featured,
      position: data.position,
      dateAdded: data.dateAdded ?? null,
      colorways: data.colorways
        .filter((c) => c.name && c.image)
        .map((c) => ({
          name: c.name,
          image: imageFor(c.image),
          redbubbleUrl: isUrl(c.redbubbleUrl) ? c.redbubbleUrl : '',
          teepublicUrl: isUrl(c.teepublicUrl) ? c.teepublicUrl : '',
        })),
    }))
    .sort(
      (a, b) =>
        (a.position ?? Infinity) - (b.position ?? Infinity) ||
        (b.dateAdded?.getTime() ?? 0) - (a.dateAdded?.getTime() ?? 0) ||
        a.title.localeCompare(b.title)
    );
}

export const designsInCause = (designs: Design[], cause: Cause) => designs.filter((d) => d.causeKeys.includes(cause.key));
export const causesOf = (design: Design, causes: Cause[]) => causes.filter((c) => design.causeKeys.includes(c.key));

/**
 * Store buttons only appear when both the store and the design (or the chosen colour) have a
 * link. A colour only shows a store's button when that store sells that exact colour.
 */
export function storeLinks(d: Design, colorway?: Colorway) {
  const teepublic = colorway ? colorway.teepublicUrl : d.teepublicUrl;
  const redbubble = colorway ? colorway.redbubbleUrl : d.redbubbleUrl;
  return {
    teepublic: settings.teepublicStore && teepublic ? teepublic : '',
    redbubble: settings.redbubbleStore && redbubble ? redbubble : '',
  };
}

/** Accepts "https://name.redbubble.com" or "https://www.redbubble.com/people/name/..." */
function redbubbleUser(): string {
  const url = settings.redbubbleStore?.trim();
  if (!url) return '';
  try {
    const u = new URL(url);
    const sub = u.hostname.match(/^([^.]+)\.redbubble\.com$/i)?.[1];
    if (sub && sub.toLowerCase() !== 'www') return sub.toLowerCase();
    return u.pathname.match(/\/people\/([^/]+)/i)?.[1]?.toLowerCase() ?? '';
  } catch {
    return '';
  }
}

export function redbubbleShopUrl(productCode?: string) {
  const user = redbubbleUser();
  if (!user) return settings.redbubbleStore || '';
  const base = `https://www.redbubble.com/people/${user}/shop?asc=u`;
  return productCode ? `${base}&iaCode=${productCode}` : base;
}

export function teepublicShopUrl(productPath?: string) {
  const base = (settings.teepublicStore || '').replace(/\/+$/, '');
  if (!base) return '';
  return productPath ? `${base}/${productPath}` : base;
}

export const products = [
  { name: 'T-Shirts', icon: 'tshirt', redbubble: 'u-tees', teepublic: 't-shirts' },
  { name: 'Hoodies', icon: 'hoodie', redbubble: 'u-sweatshirts', teepublic: 'hoodie' },
  { name: 'Hats', icon: 'hat', redbubble: 'u-baseball-cap', teepublic: 'hats' },
  { name: 'Mugs', icon: 'mug', redbubble: 'u-mugs', teepublic: 'mug' },
  { name: 'Pillows', icon: 'pillow', redbubble: 'u-pillows', teepublic: 'throw-pillows' },
  { name: 'Phone Cases', icon: 'phone', redbubble: 'u-phone-cases', teepublic: 'phone-case' },
  { name: 'Stickers', icon: 'sticker', redbubble: 'u-sticker', teepublic: 'stickers' },
  { name: 'Magnets', icon: 'magnet', redbubble: 'u-die-cut-magnet', teepublic: 'magnets' },
] as const;

export { settings };
