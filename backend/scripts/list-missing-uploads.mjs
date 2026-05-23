/**
 * Lista ficheiros referenciados na DB (plugin upload) que não existem em public/uploads.
 *
 * Uso: node --env-file=.env scripts/list-missing-uploads.mjs
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { createStrapi } = require('@strapi/strapi');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(appDir, 'public', 'uploads');

async function main() {
  const app = await createStrapi({ distDir: appDir, appDir }).load();
  try {
    const files = await app.db.query('plugin::upload.file').findMany({
      select: ['id', 'name', 'url', 'hash', 'ext'],
    });
    const missing = [];
    for (const f of files) {
      const name = f.hash && f.ext ? `${f.hash}${f.ext}` : path.basename(String(f.url || ''));
      const onDisk = name && fs.existsSync(path.join(uploadsDir, name));
      if (!onDisk) missing.push({ id: f.id, name: f.name, file: name, url: f.url });
    }
    console.log(`Total na DB: ${files.length}`);
    console.log(`Em falta no disco: ${missing.length}`);
    for (const m of missing.slice(0, 50)) {
      console.log(`- [${m.id}] ${m.name || m.file} → ${m.url}`);
    }
    if (missing.length > 50) console.log(`… e mais ${missing.length - 50}`);
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
