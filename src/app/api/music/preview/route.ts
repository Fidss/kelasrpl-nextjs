import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("track_id") || "";
  const artist = searchParams.get("artist") || "";
  const title = searchParams.get("title") || "";
  const fallbackUrl = searchParams.get("url") || "";
  const redirect = searchParams.get("redirect") === "true";

  let previewUrl = "";

  // 1. If Deezer track ID provided, get fresh signed preview
  if (trackId.startsWith("deezer_")) {
    const deezerNumericId = trackId.replace("deezer_", "").trim();
    if (deezerNumericId) {
      try {
        const res = await fetch(`https://api.deezer.com/track/${deezerNumericId}`, {
          next: { revalidate: 60 },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.preview) {
            previewUrl = data.preview;
          }
        }
      } catch (err) {
        console.error("Deezer track fetch error:", err);
      }
    }
  }

  // 2. If trackId is iTunes
  if (!previewUrl && trackId.startsWith("itunes_")) {
    const itunesNumericId = trackId.replace("itunes_", "").trim();
    if (itunesNumericId) {
      try {
        const res = await fetch(`https://itunes.apple.com/lookup?id=${itunesNumericId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results?.[0]?.previewUrl) {
            previewUrl = data.results[0].previewUrl;
          }
        }
      } catch (err) {
        console.error("iTunes lookup error:", err);
      }
    }
  }

  // 3. Search iTunes by artist and title (iTunes previews are permanent AAC on Apple CDN)
  if (!previewUrl && (artist || title)) {
    try {
      const query = `${artist} ${title}`.trim();
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=3`
      );
      if (res.ok) {
        const data = await res.json();
        const found = data.results?.find((r: any) => r.previewUrl);
        if (found?.previewUrl) {
          previewUrl = found.previewUrl;
        }
      }
    } catch (err) {
      console.error("iTunes search fallback error:", err);
    }
  }

  // 4. Search Deezer by artist and title
  if (!previewUrl && (artist || title)) {
    try {
      const query = `${artist} ${title}`.trim();
      const res = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=3`
      );
      if (res.ok) {
        const data = await res.json();
        const found = data.data?.find((r: any) => r.preview);
        if (found?.preview) {
          previewUrl = found.preview;
        }
      }
    } catch (err) {
      console.error("Deezer search fallback error:", err);
    }
  }

  // 5. If still no preview and fallbackUrl is provided and not an expired deezer link
  if (!previewUrl && fallbackUrl && !fallbackUrl.includes("cdnt-preview.dzcdn.net")) {
    previewUrl = fallbackUrl;
  }

  if (!previewUrl) {
    return NextResponse.json(
      { success: false, error: "Audio preview tidak ditemukan." },
      { status: 404 }
    );
  }

  if (redirect) {
    return NextResponse.redirect(previewUrl, 307);
  }

  return NextResponse.json({
    success: true,
    preview_url: previewUrl,
  });
}
