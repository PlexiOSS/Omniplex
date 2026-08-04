import { generateFiles } from 'fumadocs-openapi';

const targets = [
  {
    env: 'prod',
    url: 'https://spider.omniplex.gg/openapi',
  },
  {
    env: 'staging',
    url: 'https://spider-staging.omniplex.gg/openapi',
  },
];

for (const { env, url } of targets) {
  await generateFiles({
    input: [url],
    output: `./content/docs/api-reference/popplio/${env}`,
    per: 'tag',
  });
}

console.log('done');
