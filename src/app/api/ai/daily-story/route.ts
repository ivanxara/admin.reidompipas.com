import { NextResponse } from "next/server";

import { parseStoryDate } from "./story";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const storyDate = parseStoryDate(requestUrl.searchParams.get("date"));

  if (!storyDate) {
    return NextResponse.json(
      { success: false, message: "A data deve ter o formato YYYY-MM-DD" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const imageUrl = new URL("/api/ai/daily-story/image", requestUrl.origin);
  imageUrl.searchParams.set("date", storyDate.value);

  const downloadUrl = new URL(imageUrl);
  downloadUrl.searchParams.set("download", "true");

  return NextResponse.json(
    {
      success: true,
      date: storyDate.value,
      imageUrl: imageUrl.toString(),
      downloadUrl: downloadUrl.toString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
