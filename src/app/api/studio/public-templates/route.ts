import { NextResponse } from "next/server";
import { PUBLIC_API_TEMPLATES } from "@/lib/photobooth-templates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase().trim() || "";
  const category = searchParams.get("category")?.toLowerCase().trim();

  try {
    let filtered = [...PUBLIC_API_TEMPLATES];

    if (category && category !== "all") {
      filtered = filtered.filter((item) => item.category === category);
    }

    if (query) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.author.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Dynamic fallback generation from Picsum if user searches something unique
    if (query && filtered.length === 0) {
      const seed = encodeURIComponent(query);
      filtered.push({
        id: `picsum-${seed}`,
        title: `Dynamic: ${query.charAt(0).toUpperCase() + query.slice(1)}`,
        category: "aesthetic",
        thumbUrl: `https://picsum.photos/seed/${seed}/300/300`,
        imageUrl: `https://picsum.photos/seed/${seed}/1200/1800`,
        author: "Picsum Community",
        textColor: "#ffffff",
      });
    }

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error("Public templates API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
