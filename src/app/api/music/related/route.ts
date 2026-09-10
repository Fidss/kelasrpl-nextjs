import { NextRequest, NextResponse } from "next/server";

interface TrackItem {
  id: string | number;
  title: string;
  artist: string;
  artist_id?: number | null;
  album: string;
  thumbnail: string;
  duration: string;
  duration_sec: number;
  preview_url: string | null;
}

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artistId = searchParams.get("artist_id");
  const artistName = searchParams.get("artist") || searchParams.get("artist_name") || "";
  const currentId = searchParams.get("current_id") || "";

  const results: TrackItem[] = [];
  const seen = new Set<string>();
  if (currentId) seen.add(String(currentId));

  try {
    // 1. If numeric Deezer artistId is provided
    if (artistId && !isNaN(Number(artistId))) {
      try {
        const topRes = await fetch(
          `https://api.deezer.com/artist/${artistId}/top?limit=10`,
          { next: { revalidate: 86400 } }
        );
        if (topRes.ok) {
          const topData = await topRes.json();
          if (topData.data && Array.isArray(topData.data)) {
            for (const item of topData.data) {
              const key = `${item.title.toLowerCase()}|${item.artist?.name.toLowerCase()}`;
              if (!seen.has(key) && String(item.id) !== currentId) {
                seen.add(key);
                results.push({
                  id: item.id,
                  title: item.title,
                  artist: item.artist?.name || "Unknown",
                  artist_id: item.artist?.id || null,
                  album: item.album?.title || "",
                  thumbnail: item.album?.cover_medium || item.artist?.picture_medium || "",
                  duration: formatDuration(item.duration || 0),
                  duration_sec: item.duration || 0,
                  preview_url: item.preview || null,
                });
              }
            }
          }
        }
      } catch {}
    }

    // 2. Fallback search by artist name on Deezer
    if (results.length < 5 && artistName) {
      try {
        const searchRes = await fetch(
          `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artistName)}"&limit=15`,
          { next: { revalidate: 86400 } }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.data && Array.isArray(searchData.data)) {
            for (const item of searchData.data) {
              const key = `${item.title.toLowerCase()}|${item.artist?.name.toLowerCase()}`;
              if (!seen.has(key) && String(item.id) !== currentId) {
                seen.add(key);
                results.push({
                  id: item.id,
                  title: item.title,
                  artist: item.artist?.name || "Unknown",
                  artist_id: item.artist?.id || null,
                  album: item.album?.title || "",
                  thumbnail: item.album?.cover_medium || item.artist?.picture_medium || "",
                  duration: formatDuration(item.duration || 0),
                  duration_sec: item.duration || 0,
                  preview_url: item.preview || null,
                });
              }
            }
          }
        }
      } catch {}
    }

    // 3. Fallback to iTunes ID storefront
    if (results.length < 5 && artistName) {
      try {
        const itunesRes = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&country=ID&media=music&limit=15`,
          { next: { revalidate: 86400 } }
        );
        if (itunesRes.ok) {
          const itunesData = await itunesRes.json();
          if (itunesData.results && Array.isArray(itunesData.results)) {
            for (const item of itunesData.results) {
              if (item.wrapperType === "track" && item.kind === "song") {
                const key = `${item.trackName?.toLowerCase()}|${item.artistName?.toLowerCase()}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  const durSec = Math.round((item.trackTimeMillis || 0) / 1000);
                  results.push({
                    id: `itunes_${item.trackId}`,
                    title: item.trackName,
                    artist: item.artistName || "Unknown",
                    artist_id: item.artistId || null,
                    album: item.collectionName || "",
                    thumbnail: item.artworkUrl100?.replace("100x100bb", "500x500bb") || "",
                    duration: formatDuration(durSec),
                    duration_sec: durSec,
                    preview_url: item.previewUrl || null,
                  });
                }
              }
            }
          }
        }
      } catch {}
    }

    // Shuffle recommendations
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }

    return NextResponse.json({
      success: true,
      data: results.slice(0, 15),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to get related songs" },
      { status: 500 }
    );
  }
}
