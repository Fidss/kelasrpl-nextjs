import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist") || "";
  const title = searchParams.get("title") || "";
  const duration = parseInt(searchParams.get("duration") || "0");

  if (!artist && !title) {
    return NextResponse.json(
      { success: false, error: "Artist and title are required" },
      { status: 400 }
    );
  }

  try {
    // 1. Exact match attempt via LRCLIB
    const getParams = new URLSearchParams({
      artist_name: artist,
      track_name: title,
    });
    if (duration > 0) {
      getParams.set("duration", duration.toString());
    }

    try {
      const res = await fetch(`https://lrclib.net/api/get?${getParams.toString()}`, {
        headers: {
          "User-Agent": "10RPL-MusicApp/1.0",
        },
        next: { revalidate: 604800 }, // Cache 7 days
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          success: true,
          data,
        });
      }
    } catch {}

    // 2. Fallback search via LRCLIB
    try {
      const searchRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`,
        {
          headers: {
            "User-Agent": "10RPL-MusicApp/1.0",
          },
          next: { revalidate: 604800 },
        }
      );

      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          const matchWithSynced = results.find((r) => r.syncedLyrics) || results[0];
          return NextResponse.json({
            success: true,
            data: matchWithSynced,
          });
        }
      }
    } catch {}

    return NextResponse.json(
      { success: false, error: "Lyrics not found" },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error fetching lyrics" },
      { status: 500 }
    );
  }
}
