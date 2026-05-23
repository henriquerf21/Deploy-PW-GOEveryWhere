/**
 * Cria utilizador Users & Permissions para login no Back-Office (email/password).
 *
 * Uso:
 *   node --env-file=.env scripts/create-bo-user.mjs
 *   node --env-file=.env scripts/create-bo-user.mjs luis@goeverywhere.pt 'A tua password'
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { createStrapi } = require('@strapi/strapi');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');

const email = String(process.argv[2] || 'luis@goeverywhere.pt').trim().toLowerCase();
const password = String(process.argv[3] || 'LuisBo2026!');
const firstName = String(process.argv[4] || 'Luis').trim();
const lastName = String(process.argv[5] || 'Admin').trim();

async function main() {
  const app = await createStrapi({ distDir: appDir, appDir }).load();
  try {
    const existing = await app.db.query('plugin::users-permissions.user').findOne({
      where: { email },
      select: ['id', 'email', 'firstName', 'lastName'],
    });
    if (existing) {
      console.log(`Utilizador já existe: ${existing.email} (id ${existing.id})`);
      return;
    }

    const role = await app.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
      select: ['id'],
    });
    if (!role?.id) {
      throw new Error('Role authenticated não encontrada.');
    }

    const created = await app.plugin('users-permissions').service('user').add({
      username: email,
      email,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: role.id,
      firstName,
      lastName,
      password,
    });

    console.log('Utilizador BO criado:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Nome:     ${firstName} ${lastName}`.trim());
    console.log(`  ID:       ${created.id}`);
    console.log('Login: Back-Office → http://localhost:5174');
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
