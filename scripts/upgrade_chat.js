const postgres = require("postgres");
const sql = postgres(
  process.env.DATABASE_URL ||
    "postgres://postgres.aywjdrtuegffdmqywhrj:Fidss123%40123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
  { ssl: { rejectUnauthorized: false } }
);

async function cleanAndUpgrade() {
  console.log("Upgrading database schema for edit & delete messages...");
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE`;
  console.log("✓ Added is_edited column to messages");

  // Inspect direct conversations to find duplicates
  const directConvs = await sql`
    SELECT c.id, c.created_at, c.last_message_at,
           ARRAY_AGG(cm.user_id ORDER BY cm.user_id) as member_ids,
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
    FROM conversations c
    JOIN conversation_members cm ON c.id = cm.conversation_id
    WHERE c.type = 'direct'
    GROUP BY c.id
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  `;

  console.log(`Found ${directConvs.length} direct conversations.`);
  const seenPairs = new Set();
  const duplicateIdsToDelete = [];

  for (const conv of directConvs) {
    const pairKey = conv.member_ids.join("-");
    if (seenPairs.has(pairKey)) {
      console.log(`Duplicate found for pair ${pairKey}: Conv ID ${conv.id} with ${conv.message_count} messages`);
      duplicateIdsToDelete.push(conv.id);
    } else {
      seenPairs.add(pairKey);
    }
  }

  if (duplicateIdsToDelete.length > 0) {
    console.log(`Deleting ${duplicateIdsToDelete.length} duplicate conversation(s):`, duplicateIdsToDelete);
    // Delete duplicate conversation rows (CASCADE will delete members & messages)
    await sql`DELETE FROM conversations WHERE id = ANY(${duplicateIdsToDelete})`;
    console.log("✓ Duplicate conversations cleaned up!");
  } else {
    console.log("✓ No duplicate direct conversations found in database.");
  }

  await sql.end();
}

cleanAndUpgrade().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
