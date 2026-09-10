import { NextRequest, NextResponse } from "next/server";

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json({ success: false, data: [] });
  }

  try {
    const tracks: any[] = [];
    const seen = new Set<string>();

    // 1. Try Deezer Search API
    try {
      const res = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(q.trim())}&limit=20`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          for (const item of json.data) {
            const dur = item.duration || 0;
            // Exclude tracks shorter than 30s or longer than 12 mins
            if (dur > 0 && (dur < 30 || dur > 720)) continue;

            const key = `${item.title.toLowerCase()}|${item.artist?.name.toLowerCase()}`;
            if (!seen.has(key)) {
              seen.add(key);
              const thumb = item.album?.cover_medium || item.album?.cover || item.artist?.picture_medium || "";
              tracks.push({
                id: item.id,
                track_id: `deezer_${item.id}`,
                title: item.title,
                artist: item.artist?.name || "Unknown Artist",
                artist_id: item.artist?.id || null,
                album: item.album?.title || "",
                thumbnail: thumb,
                album_art: thumb,
                duration: formatDuration(dur),
                duration_sec: dur,
                preview_url: item.preview || "",
                source: "deezer",
              });
            }
          }
        }
      }
    } catch {}

    // 2. Try iTunes Search API (Storefront ID & Global)
    if (tracks.length < 5) {
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(q.trim())}&country=ID&media=music&limit=20`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.results && Array.isArray(json.results)) {
            for (const item of json.results) {
              if (item.wrapperType === "track" && item.kind === "song") {
                const durSec = Math.round((item.trackTimeMillis || 0) / 1000);
                if (durSec > 0 && (durSec < 30 || durSec > 720)) continue;

                const key = `${item.trackName?.toLowerCase()}|${item.artistName?.toLowerCase()}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  const thumb = item.artworkUrl100?.replace("100x100bb", "500x500bb") || "";
                  tracks.push({
                    id: `itunes_${item.trackId}`,
                    track_id: `itunes_${item.trackId}`,
                    title: item.trackName,
                    artist: item.artistName || "Unknown Artist",
                    artist_id: item.artistId || null,
                    album: item.collectionName || "",
                    thumbnail: thumb,
                    album_art: thumb,
                    duration: formatDuration(durSec),
                    duration_sec: durSec,
                    preview_url: item.previewUrl || "",
                    source: "itunes",
                  });
                }
              }
            }
          }
        }
      } catch {}
    }

    return NextResponse.json({ success: true, data: tracks });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mencari musik." },
      { status: 500 }
    );
  }
}
