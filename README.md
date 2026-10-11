# I Want My Democracy: website

The website at **www.iwantmydemocracy.com**: a shop window for the I Want My Democracy designs sold on
[TeePublic](https://www.teepublic.com/user/i-want-my-democracy) and [Redbubble](https://FauberDesign.redbubble.com).

## Everyday changes: use the online editor

Go to **https://app.pagescms.org**, sign in with the `IWantMyDemocracy` GitHub account and open this website.

- **Designs**: add a design, replace its picture, change its causes or store links, feature it on the home page, or hide it.
- **Causes**: the groups designs are sorted into (Vote for Democracy, No Kings, …) and their order.
- **Settings**: message bar, tagline, store links, email, social links and About text.

Every save publishes the website automatically in about 2 minutes.

## How it works (for developers)

- [Astro](https://astro.build) static site. Pages are in `src/pages`, building blocks in `src/components`.
- Content: `src/content/designs/*.md`, `src/content/causes/*.md` and `src/data/settings.json`, with pictures in `src/assets/designs`.
  Schema in `src/content.config.ts`. Lookups, store links and product filters are in `src/lib/catalog.ts`.
- Editor configuration: `.pages.yml` ([Pages CMS](https://pagescms.org)).
- Publishing: `.github/workflows/deploy.yml` builds the site and deploys it to GitHub Pages on every push to `main`.
- Social preview pictures (`/og/<design>.png`) are generated at build time by `src/lib/og.ts`.

```bash
npm install
npm run dev
```

One-time helper scripts are in `scripts/`. `prepare-brand.mjs` made the web versions of the logo and donkey,
and `seed/` loaded the starting catalog.
