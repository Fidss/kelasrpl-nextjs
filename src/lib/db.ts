import postgres from "postgres";

// Normalize connection string to port 6543 (Supabase Transaction Pooler) for Serverless
const rawConnectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres.aywjdrtuegffdmqywhrj:Fidss123%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

const connectionString = rawConnectionString.includes("pooler.supabase.com:5432")
  ? rawConnectionString.replace(":5432", ":6543")
  : rawConnectionString;

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ||
  postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 5,
    prepare: false, // Required for transaction mode pooler (PGBouncer / Supabase port 6543)
  });

globalForDb.sql = sql;

export default sql;
