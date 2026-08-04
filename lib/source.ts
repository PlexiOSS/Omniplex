import { docs, meta } from '@/.source';
import { createMDXSource } from 'fumadocs-mdx';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(docs, meta),
});

export function getPageImageUrl(page: { slugs: string[] }) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: '/og/docs/' + segments.join('/'),
  };
}
