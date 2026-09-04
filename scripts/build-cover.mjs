import { spawnSync } from 'node:child_process';
import { rename } from 'node:fs/promises';

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(process.execPath, [
  'node_modules/vite/bin/vite.js',
  'build',
  '--config',
  'vite.cover.config.ts',
]);
await rename('dist/cover-only.html', 'dist/index.html');
run(process.execPath, ['scripts/prepare-sites-build.mjs']);
