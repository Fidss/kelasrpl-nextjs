import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgres://postgres.aywjdrtuegffdmqywhrj:Fidss123%40123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

const globalForDb = global as unknown as { sql: postgres.Sql };

export const sql =
  globalForDb.sql ||
  postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    max: 5,
    idle_timeout: 10,
    connect_timeout: 5,
    max_lifetime: 60 * 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export default sql;
