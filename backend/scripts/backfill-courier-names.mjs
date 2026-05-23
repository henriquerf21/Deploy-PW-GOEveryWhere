/**
 * Preenche firstName/lastName a partir de fullName nos estafetas existentes.
 *
 * Uso: node --env-file=.env scripts/backfill-courier-names.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { createStrapi } = require('@strapi/strapi');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');

function splitFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function main() {
  const app = await createStrapi({ distDir: appDir, appDir }).load();
  try {
    const rows = await app.documents('api::courier-estafeta.courier-estafeta').findMany({
      status: 'published',
    });
    let updated = 0;
    for (const row of rows) {
      const fullName = row.fullName || '';
      if (!fullName.trim()) continue;
      const { firstName, lastName } = splitFullName(fullName);
      if (row.firstName === firstName && row.lastName === lastName) continue;
      await app.documents('api::courier-estafeta.courier-estafeta').update({
        documentId: row.documentId,
        data: { firstName, lastName, fullName: fullName.trim() },
        status: 'published',
      });
      updated += 1;
      console.log(`✓ ${fullName} → ${firstName} | ${lastName}`);
    }
    console.log(`Concluído: ${updated} estafeta(s) atualizado(s) de ${rows.length}.`);
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
