/**
 * Apaga todos os registos de: reviews, deliveries, orders, notifications, courier_estafetas
 * e respetivos links / histórico / uploads ligados a estafetas.
 * NÃO altera permissões, roles, utilizadores (up_users), produtos, lojas, go_points, etc.
 *
 * Uso:
 *   node --env-file=.env scripts/purge-logistics-data.mjs --confirm
 */
import pg from 'pg';

const HISTORY_TYPES = [
  'api::order.order',
  'api::courier-estafeta.courier-estafeta',
  'api::notification.notification',
  'api::delivery.delivery',
  'api::review.review',
];

const COURIER_RELATED_TYPE = 'api::courier-estafeta.courier-estafeta';

async function count(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  return Number(rows[0]?.n ?? 0);
}

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error('Refused: add --confirm to run (irreversible).');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL missing (.env)');
    process.exit(1);
  }

  const useSsl =
    String(process.env.DATABASE_SSL).toLowerCase() === 'true' || url.includes('supabase');
  const client = new pg.Client({
    connectionString: url,
    ssl: useSsl
      ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' }
      : undefined,
  });
  await client.connect();

  try {
    await client.query('BEGIN');

    const before = {
      reviews: await count(client, 'select count(*)::int as n from reviews'),
      deliveries: await count(client, 'select count(*)::int as n from deliveries'),
      orders: await count(client, 'select count(*)::int as n from orders'),
      notifications: await count(client, 'select count(*)::int as n from notifications'),
      couriers: await count(client, 'select count(*)::int as n from courier_estafetas'),
    };
    console.log('Antes:', before);

    await client.query(
      `delete from strapi_history_versions where content_type = any($1::text[])`,
      [HISTORY_TYPES]
    );

    const { rows: fileRows } = await client.query(
      `select distinct file_id from files_related_mph where related_type = $1`,
      [COURIER_RELATED_TYPE]
    );
    const fileIds = fileRows.map((r) => r.file_id).filter(Boolean);
    if (fileIds.length) {
      await client.query(`delete from files_folder_lnk where file_id = any($1::int[])`, [fileIds]);
      await client.query(`delete from files_related_mph where related_type = $1`, [COURIER_RELATED_TYPE]);
      await client.query(`delete from files where id = any($1::int[])`, [fileIds]);
    } else {
      await client.query(`delete from files_related_mph where related_type = $1`, [COURIER_RELATED_TYPE]);
    }

    await client.query('delete from reviews');
    await client.query('delete from deliveries');
    await client.query('delete from orders');
    await client.query('delete from notifications');
    await client.query('delete from courier_estafetas');

    const after = {
      reviews: await count(client, 'select count(*)::int as n from reviews'),
      deliveries: await count(client, 'select count(*)::int as n from deliveries'),
      orders: await count(client, 'select count(*)::int as n from orders'),
      notifications: await count(client, 'select count(*)::int as n from notifications'),
      couriers: await count(client, 'select count(*)::int as n from courier_estafetas'),
    };
    console.log('Depois:', after);

    await client.query('COMMIT');
    console.log('Concluído (transaction committed).');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Rollback:', e.message);
    throw e;
  } finally {
    await client.end();
  }
}

main().catch(() => process.exit(1));
