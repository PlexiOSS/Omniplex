import { generateFiles } from 'fumadocs-openapi';

// Popplio's staging instance was deprecated, so this only generates against
// production now — api.omniplex.gg is the canonical public domain (an alias
// of spider.omniplex.gg, which still resolves but shouldn't be documented).
await generateFiles({
  input: ['https://api.omniplex.gg/openapi'],
  output: './content/docs/api-reference',
  per: 'tag',
});

console.log('done');
