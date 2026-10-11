// Lists every unique Redbubble and TeePublic link in the built site (dist/), for checking.
// Usage: npm run build, then node scripts/list-store-links.mjs
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const links = new Set();

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(p);
    else if (entry.name.endsWith('.html')) {
      const html = await readFile(p, 'utf8');
      for (const [, href] of html.matchAll(/href="(https:\/\/[^"]*(?:redbubble|teepublic)\.com[^"]*)"/g)) {
        links.add(href.replace(/&amp;/g, '&'));
      }
    }
  }
}

await walk(dist);
console.log(JSON.stringify([...links].sort(), null, 1));
