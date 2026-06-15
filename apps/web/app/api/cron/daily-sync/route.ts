import { NextRequest, NextResponse } from "next/server";
import { scraperSyncAll } from "@/lib/scraper";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const result = await scraperSyncAll();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error en sync diario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
