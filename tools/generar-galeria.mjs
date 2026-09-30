import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const photosDir = join(root, 'fotos');
const valid = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

await mkdir(photosDir, { recursive: true });

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else if (valid.has(extname(entry.name).toLowerCase())) result.push(full);
  }
  return result;
}

const files = (await walk(photosDir))
  .map(file => relative(root, file).split('\\').join('/').split('/').map(encodeURIComponent).join('/'))
  .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

await writeFile(join(root, 'fotos.json'), JSON.stringify(files, null, 2) + '\n');
console.log(`✦ Galería actualizada: ${files.length} foto${files.length === 1 ? '' : 's'}.`);
