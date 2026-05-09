import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(65000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    } catch {
      // Try next endpoint
    }
  }

  return NextResponse.json(
    { error: "All Overpass endpoints failed" },
    { status: 503 }
  );
}
