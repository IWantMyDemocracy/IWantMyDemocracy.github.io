import type { APIRoute, GetStaticPaths } from 'astro';
import path from 'node:path';
import { getDesigns } from '../../lib/catalog';
import { defaultOgImage, designOgImage } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = async () => {
  const designs = await getDesigns();
  return [
    { params: { slug: 'default' }, props: { file: null, isDefault: true } },
    ...designs.map((d) => ({
      params: { slug: d.id },
      props: { file: d.imageFile ? path.join(process.cwd(), 'src/assets/designs', d.imageFile) : null, isDefault: false },
    })),
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const png = props.isDefault ? await defaultOgImage() : await designOgImage(props.file);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
