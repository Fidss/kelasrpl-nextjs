const postgres = require("postgres");
const bcrypt = require("bcryptjs");

const sql = postgres(
  "postgres://postgres.aywjdrtuegffdmqywhrj:Fidss123%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
  { ssl: { rejectUnauthorized: false }, prepare: false }
);

async function test() {
  const t0 = Date.now();
  console.log("Checking admin user...");
  const admin = await sql`
    SELECT id, name, nis, email, password, role
    FROM users
    WHERE nis = 'admin' OR LOWER(name) = LOWER('admin')
    LIMIT 1
  `;
  console.log(`Admin query took ${Date.now() - t0}ms:`, admin[0]?.name, admin[0]?.role);

  const t1 = Date.now();
  console.log("Checking fadhyl user...");
  const fadhyl = await sql`
    SELECT id, name, nis, email, password, role
    FROM users
    WHERE nis = 'FADHYL ALHAFIZD' OR LOWER(name) = LOWER('FADHYL ALHAFIZD')
    LIMIT 1
  `;
  console.log(`Fadhyl query took ${Date.now() - t1}ms:`, fadhyl[0]?.name, fadhyl[0]?.role);

  process.exit(0);
}

test().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
