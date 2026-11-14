import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

let token = process.env.MAPBOX_PUBLIC_TOKEN;
if (!token) {
  try {
    token = (await import('./config.js')).MAPBOX_ACCESS_TOKEN;
  } catch {
    // Local configuration is optional when CI supplies the public token.
  }
}
if (!token?.startsWith('pk.')) throw new Error('Set the MAPBOX_PUBLIC_TOKEN Actions secret or configure a local public token.');

await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const file of ['index.html', 'global.css', 'map.css', 'map.js', 'traffic.js', 'assets']) {
  await cp(file, `dist/${file}`, { recursive: true });
}
await writeFile('dist/config.js', `export const MAPBOX_ACCESS_TOKEN = ${JSON.stringify(token)};\n`);
await writeFile('dist/.nojekyll', '');
console.log('Built Bikewatching in dist/.');
