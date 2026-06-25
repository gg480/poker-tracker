import { NextRequest, NextResponse } from "next/server"
import { getGTORanges } from "@/services/coach-service"
import type { Position } from "@/lib/coach/types"

// GET /api/coach/gtoranges — Preflop GTO 范围表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get("position") as Position | null

    const ranges = getGTORanges(position || undefined)
    return NextResponse.json({ success: true, data: ranges })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
