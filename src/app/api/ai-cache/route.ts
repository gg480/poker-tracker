import { NextRequest, NextResponse } from "next/server";
import { getAllAICache, insertAICache, updateAICache, trimAICache } from "@/storage/database/crud-server";

export async function GET() {
  try {
    const data = await getAllAICache();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cache = await request.json();
    const data = await insertAICache(cache);
    await trimAICache(3); // 只保留最新3条
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, result } = await request.json();
    const data = await updateAICache(id, result);
    await trimAICache(3); // 只保留最新3条
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
