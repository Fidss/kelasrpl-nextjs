const postgres = require("postgres");
const sql = postgres(
  "postgres://postgres.aywjdrtuegffdmqywhrj:Fidss123%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
  { ssl: { rejectUnauthorized: false }, prepare: false }
);

async function testAll() {
  console.log("Testing DB tables...");
  try {
    const users = await sql`SELECT id, name, role FROM users LIMIT 3`;
    console.log("✓ Users:", users);

    const piket = await sql`SELECT * FROM piket_kebersihan LIMIT 3`;
    console.log("✓ Piket Kebersihan:", piket);

    const kas_settings = await sql`SELECT * FROM kas_settings LIMIT 1`;
    console.log("✓ Kas Settings:", kas_settings);

    const kas_payments = await sql`SELECT * FROM kas_payments LIMIT 3`;
    console.log("✓ Kas Payments:", kas_payments);

    const kas_tx = await sql`SELECT * FROM kas_transactions LIMIT 3`;
    console.log("✓ Kas Transactions:", kas_tx);

    const menfesses = await sql`
      SELECT m.*, u.name as recipient_name 
      FROM menfesses m 
      LEFT JOIN users u ON m.recipient_id = u.id 
      LIMIT 3
    `;
    console.log("✓ Menfesses with JOIN:", menfesses);

    const menfessesCount = await sql`SELECT count(*) FROM menfesses`;
    console.log("✓ Total Menfesses:", menfessesCount);

    process.exit(0);
  } catch (err) {
    console.error("❌ DB Query Error:", err);
    process.exit(1);
  }
}

testAll();
