import { NextRequest, NextResponse } from "next/server";
import { getAllClears, getClearsBySeason, insertClearRecord } from "@/storage/database/crud";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("season_id");

    let data;
    if (seasonId) {
      data = getClearsBySeason(seasonId);
    } else {
      data = getAllClears();
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const record = await request.json();
    const data = insertClearRecord(record);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
