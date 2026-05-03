import { NextRequest, NextResponse } from "next/server";
import { getAwardsBySeason, insertAwardRecord, insertAwardRecords } from "@/storage/database/crud";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("season_id");

    if (!seasonId) {
      return NextResponse.json({ success: false, error: "Missing season_id" }, { status: 400 });
    }

    const data = getAwardsBySeason(seasonId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (Array.isArray(body)) {
      const data = insertAwardRecords(body);
      return NextResponse.json({ success: true, data });
    }
    const data = insertAwardRecord(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
