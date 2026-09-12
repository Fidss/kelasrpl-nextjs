const postgres = require("c:/belajar/kelasrpl-next/node_modules/postgres");
const sql = postgres(
  process.env.DATABASE_URL ||
    "postgres://postgres.aywjdrtuegffdmqywhrj:Fidss123%40123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
  { ssl: { rejectUnauthorized: false } }
);

async function runMigration() {
  console.log("Starting database migration for Chat and Profile...");

  // 1. Add avatar_url and bio to users table if they don't exist
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
  console.log("✓ Added avatar_url and bio columns to users table");

  // 2. Create conversations table
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id BIGSERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL DEFAULT 'direct',
      name VARCHAR(255),
      avatar_url TEXT,
      description TEXT,
      created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
      last_message_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
    )
  `;
  console.log("✓ Created conversations table");

  // 3. Create conversation_members table
  await sql`
    CREATE TABLE IF NOT EXISTS conversation_members (
      id BIGSERIAL PRIMARY KEY,
      conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      last_read_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
      UNIQUE(conversation_id, user_id)
    )
  `;
  console.log("✓ Created conversation_members table");

  // 4. Create messages table
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      media_url TEXT,
      media_type VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
    )
  `;
  console.log("✓ Created messages table");

  // 5. Create indexes one by one
  await sql`CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members(conversation_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at)`;
  console.log("✓ Created indexes for chat system");

  console.log("Migration completed successfully!");
  await sql.end();
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
