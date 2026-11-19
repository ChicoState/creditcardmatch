import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const container = 'supabase_db_creditcardmatch';
const database = `ccm_survey_test_${process.pid}_${randomUUID().replaceAll('-', '').slice(0, 8)}`;
const tables = [
  'auth.users',
  'public.profiles',
  'public.user_preferences',
  'public.user_category_spend',
  'public.user_filter_preferences',
  'public.reward_categories',
  'public.filters',
];

function docker(args: string[], input = ''): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'docker',
      args,
      { timeout: 25_000, maxBuffer: 8 * 1024 * 1024 },
      (error, stdout, stderr) =>
        error ? reject(new Error(stderr || error.message)) : resolve(stdout),
    );
    child.stdin?.end(input);
  });
}

function psqlArgs(name: string) {
  return [
    'exec',
    '-i',
    container,
    'psql',
    '-X',
    '-qAt',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    'postgres',
    '-d',
    name,
  ];
}

export function sql(source: string, name = database) {
  return docker(psqlArgs(name), `SET statement_timeout = '10s';\n${source}\n`);
}

export function literal(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

export function asUser(user: string, source: string) {
  return sql(`BEGIN; SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub', ${literal(user)}, true);
    ${source} COMMIT;`);
}

export async function createDatabase() {
  await sql(`CREATE DATABASE ${database};`, 'postgres');
  try {
    const definitions = await docker([
      'exec',
      container,
      'pg_dump',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '--schema-only',
      '--no-owner',
      '--no-comments',
      ...tables.map((table) => `--table=${table}`),
    ]);
    const uidFunction = await sql(
      "SELECT pg_get_functiondef('auth.uid()'::regprocedure);",
      'postgres',
    );
    await sql(`CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated, anon;
      ${uidFunction}\n${definitions}`);
    await sql(
      await readFile(
        'supabase/migrations/20261119120000_atomic_saved_survey.sql',
        'utf8',
      ),
    );
    await sql(`
      INSERT INTO public.reward_categories (category_name, slug) VALUES ('Groceries', 'groceries'), ('Dining', 'dining');
      INSERT INTO public.filters (slug, label) VALUES ('cashback', 'Cashback'), ('no-annual-fee', 'No annual fee');
    `);
  } catch (error) {
    await dropDatabase();
    throw error;
  }
}

export async function dropDatabase() {
  await sql(`DROP DATABASE IF EXISTS ${database} WITH (FORCE);`, 'postgres');
}

export async function createUser() {
  const id = randomUUID();
  await sql(`INSERT INTO auth.users (id) VALUES (${literal(id)});`);
  return id;
}
