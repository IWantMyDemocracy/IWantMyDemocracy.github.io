// Site-wide settings from src/data/settings.json (edited under Settings in the online editor),
// checked the same way designs and causes are: missing fields become empty, and links that
// aren't real web addresses are ignored, so a typo can't break the site or show a broken link.
import { z } from 'astro/zod';
import raw from '../data/settings.json';

const text = z.string().nullish().transform((v) => (v ?? '').trim());
const url = text.transform((v) => (/^https?:\/\/\S+$/i.test(v) ? v : ''));
const email = text.transform((v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : ''));
/** "YYYY-MM-DD" or empty. */
const day = text.transform((v) => (/^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : ''));

const schema = z.object({
  messageBar: text,
  messageBarUntil: day,
  tagline: text,
  teepublicStore: url,
  redbubbleStore: url,
  email,
  facebook: url,
  instagram: url,
  threads: url,
  x: url,
  bluesky: url,
  tiktok: url,
  aboutShort: text,
  aboutText: text,
});

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  throw new Error(`src/data/settings.json has a problem: ${parsed.error.message}`);
}

export const settings = parsed.data;
export type Settings = typeof settings;
