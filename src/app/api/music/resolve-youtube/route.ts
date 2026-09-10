import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist") || "";
  const title = searchParams.get("title") || "";
  const duration = parseInt(searchParams.get("duration") || "0");
  const deezerId = searchParams.get("deezer_id") || searchParams.get("id") || "";

  // Fast resolution for tracks with yt_ prefix
  if (deezerId.startsWith("yt_")) {
    const videoId = deezerId.slice(3);
    if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({
        success: true,
        video_id: videoId,
      });
    }
  }

  if (!artist && !title) {
    return NextResponse.json(
      { success: false, error: "Artist and title are required" },
      { status: 400 }
    );
  }

  const cleanArtist = artist.trim().replace(/\s+/g, " ");
  const cleanTitle = title.trim().replace(/\s+/g, " ");

  const queries = [
    `${cleanArtist} ${cleanTitle} audio`,
    `${cleanArtist} ${cleanTitle} official audio`,
    `${cleanArtist} ${cleanTitle} lyrics`,
    `${cleanArtist} ${cleanTitle}`,
  ];

  for (const q of queries) {
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        next: { revalidate: 86400 }, // Cache YouTube search for 24h
      });

      const html = await res.text();
      const match = html.match(/var ytInitialData = (.*?);<\/script>/);
      if (!match) continue;

      const json = JSON.parse(match[1]);
      const contents =
        json?.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ||
        [];

      for (const item of contents) {
        if (!item.videoRenderer?.videoId) continue;
        const v = item.videoRenderer;
        const titleText = (v.title?.runs?.[0]?.text || "").toLowerCase();
        const durStr = v.lengthText?.simpleText || "";
        if (!durStr || durStr === "0:00") continue;

        // Parse duration seconds
        const parts = durStr.split(/[:.]/).map(Number);
        let sec = 0;
        if (parts.length === 2) sec = parts[0] * 60 + parts[1];
        else if (parts.length === 3)
          sec = parts[0] * 3600 + parts[1] * 60 + parts[2];

        // Skip compilation videos (>12 min or <30 sec or compilation keywords)
        if (sec > 720 || sec < 30) continue;
        if (
          titleText.includes("full album") ||
          titleText.includes("kompilasi") ||
          titleText.includes("koleksi") ||
          titleText.includes("podcast")
        ) {
          continue;
        }

        // If expected duration is known, check deviation
        if (duration > 0 && Math.abs(sec - duration) > 180 && sec > duration * 1.6) {
          continue;
        }

        return NextResponse.json({
          success: true,
          video_id: v.videoId,
          title: v.title?.runs?.[0]?.text,
          duration_sec: sec,
        });
      }
    } catch (e) {
      console.error("Error searching YouTube:", e);
    }
  }

  return NextResponse.json(
    { success: false, error: "Could not resolve to YouTube video" },
    { status: 404 }
  );
}
