import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const dist = resolve('dist');
const client = join(dist, 'client');
const server = join(dist, 'server');

// The application is a client-side Vite SPA. Sites expects the same static
// output alongside a small Cloudflare Worker entry point, so keep the app
// bundle intact and arrange it in the Sites artifact shape after Vite builds.
await rm(client, { recursive: true, force: true });
await rm(server, { recursive: true, force: true });
await mkdir(client, { recursive: true });

for (const entry of await readdir(dist, { withFileTypes: true })) {
  if (entry.name === 'client' || entry.name === 'server' || entry.name === '.openai') {
    continue;
  }

  await rename(join(dist, entry.name), join(client, entry.name));
}

await mkdir(server, { recursive: true });
await writeFile(
  join(server, 'index.js'),
  `export default {\n  async fetch(request, env) {\n    const url = new URL(request.url);\n    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;\n    const assetRequest = new Request(new URL(pathname, url), request);\n    const response = await env.ASSETS.fetch(assetRequest);\n\n    if (response.status !== 404 || !['GET', 'HEAD'].includes(request.method) || pathname.includes('.')) {\n      return response;\n    }\n\n    return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));\n  },\n};\n`,
);

await writeFile(
  join(server, 'wrangler.json'),
  `${JSON.stringify(
    {
      name: 'labs-cover-generator',
      main: './index.js',
      compatibility_date: '2026-08-29',
      compatibility_flags: ['nodejs_compat'],
      assets: {
        directory: '../client',
        binding: 'ASSETS',
        not_found_handling: 'single-page-application',
      },
    },
    null,
    2,
  )}\n`,
);
