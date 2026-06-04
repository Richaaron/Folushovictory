import { Client } from 'pg';
import dotenv from 'dotenv';
import { config } from '../src/config.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL || config.supabaseUrl;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseServiceRoleKey;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Aborting.');
    process.exit(1);
  }

  // Extract PG connection string from SUPABASE_URL (expected in form https://<project>.supabase.co)
  // Use the service role key as password and default host/port/dbname values
  // Alternatively, user can set PG_CONNECTION_STRING env var directly.
  const pgConn = process.env.PG_CONNECTION_STRING;
  let client;
  try {
    if (pgConn) {
      client = new Client({ connectionString: pgConn });
    } else {
      // Construct connection from SUPABASE_URL
      const match = supabaseUrl.match(/^https:\/\/(.+)$/);
      const host = match ? match[1] : null;
      if (!host) throw new Error('Invalid SUPABASE_URL');
      client = new Client({ host, port: 5432, user: 'postgres', password: supabaseKey, database: 'postgres' });
    }

    await client.connect();

    const createIds = `
CREATE TABLE IF NOT EXISTS public.ids (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0
);
`;

    const createRegistrationCodes = `
CREATE TABLE IF NOT EXISTS public.registrationCodes (
  code text PRIMARY KEY,
  displayName text,
  email text,
  subjectIds jsonb DEFAULT '[]',
  formClassId text,
  createdAt timestamptz DEFAULT now(),
  expiresAt timestamptz,
  used boolean DEFAULT false,
  usedBy text,
  usedAt timestamptz,
  status text DEFAULT 'ACTIVE'
);
`;

    console.log('Creating tables...');
    await client.query(createIds);
    await client.query(createRegistrationCodes);

    console.log('Tables created or already exist.');
    await client.end();
  } catch (err) {
    console.error('Failed to create tables:', err.message || err);
    if (client) await client.end();
    process.exit(1);
  }
}

run();
