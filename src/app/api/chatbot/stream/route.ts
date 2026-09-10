import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { message, session_id, attachments } = await req.json();

  if (!message || !message.trim()) {
    return new Response(JSON.stringify({ error: "Pesan tidak boleh kosong" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let currentSessionId = session_id ? parseInt(session_id) : null;
  const now = new Date();

  // Create or verify session
  if (!currentSessionId) {
    const title = message.trim().slice(0, 24) + (message.length > 24 ? "..." : "");
    const newSession = await sql`
      INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
      VALUES (${user.id}, ${title}, ${now}, ${now})
      RETURNING id
    `;
    currentSessionId = newSession[0].id;
  } else {
    // Verify session ownership
    const valid = await sql`
      SELECT id FROM chat_sessions
      WHERE id = ${currentSessionId} AND user_id = ${user.id}
      LIMIT 1
    `;
    if (valid.length === 0) {
      return new Response(JSON.stringify({ error: "Sesi tidak ditemukan" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    await sql`
      UPDATE chat_sessions
      SET updated_at = ${now}
      WHERE id = ${currentSessionId}
    `;
  }

  // Save user message
  await sql`
    INSERT INTO chat_messages (chat_session_id, role, content, attachments, created_at, updated_at)
    VALUES (
      ${currentSessionId},
      'user',
      ${message.trim()},
      ${attachments ? JSON.stringify(attachments) : null},
      ${now},
      ${now}
    )
  `;

  // Fetch session history
  const history = await sql`
    SELECT role, content
    FROM chat_messages
    WHERE chat_session_id = ${currentSessionId}
    ORDER BY created_at ASC
  `;

  const jakartaTimeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date()) + " WIB";

  const systemPrompt = `Kamu adalah asisten AI ramah bernama "Elostra" untuk membantu siswa 10 RPL SMK Negeri 17 Jakarta. Waktu dan tanggal realtime saat ini di Jakarta: ${jakartaTimeStr}. Gunakan informasi waktu ini secara akurat jika siswa menanyakan tanggal, hari, jam, atau hal yang berkaitan dengan waktu saat ini. Walaupun namamu Elostra (juga bisa dipanggil RPL Bot), kamu sangat serbaguna dan BISA menjawab pertanyaan dari SEMUA mata pelajaran, termasuk Matematika (MTK), Bahasa, Sains, dll. Jangan pernah menolak menjawab pertanyaan non-RPL. Berikan penjelasan yang mudah dipahami. Jawab dengan bahasa Indonesia yang santai tapi sopan. Jika seseorang bertanya siapa kamu, beritahu bahwa namamu adalah Elostra dan kamu dibuat oleh tim developer: Fadhyl Alhafizd, M. Hussein Haekal, dan Bintang Very Purwanto.`;

  const messagesToSend = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
  ];

  const apiUrl = process.env.NINEROUTER_API_URL || "https://9router.elostra.my.id/v1/chat/completions";
  const apiKey = process.env.NINEROUTER_API_KEY || "sk-74673f7cba8fc46a-orrdr4-15425a05";

  let fullAssistantResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Emit session meta
      controller.enqueue(
        encoder.encode(`event: meta\ndata: ${JSON.stringify({ session_id: currentSessionId })}\n\n`)
      );

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "9router",
            messages: messagesToSend,
            stream: true,
          }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Gagal terhubung ke AI service: " + errText })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              break;
            }

            try {
              const json = JSON.parse(dataStr);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                fullAssistantResponse += delta;
              }
              controller.enqueue(encoder.encode(`${trimmed}\n\n`));
            } catch {
              // Ignore partial JSON
            }
          }
        }
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        );
      } finally {
        // Save assistant message in DB if any content was received
        if (fullAssistantResponse.trim()) {
          const finishedAt = new Date();
          await sql`
            INSERT INTO chat_messages (chat_session_id, role, content, created_at, updated_at)
            VALUES (${currentSessionId}, 'assistant', ${fullAssistantResponse}, ${finishedAt}, ${finishedAt})
          `;
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
