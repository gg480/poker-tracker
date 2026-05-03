import { NextRequest, NextResponse } from "next/server";
import { getAllAICache, insertAICache, updateAICache, trimAICache } from "@/storage/database/crud";

export async function GET() {
  try {
    const data = getAllAICache();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cache = await request.json();
    const data = insertAICache(cache);
    trimAICache(3);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, result } = await request.json();
    const data = updateAICache(id, result);
    trimAICache(3);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
