import { NextRequest, NextResponse } from "next/server"
import { computeEquity } from "@/services/coach-service"
import type { EquityQuery } from "@/lib/coach/types"

// POST /api/coach/equity — 手牌胜率计算
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EquityQuery

    if (!body.holeCards || body.holeCards.length !== 2) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid holeCards (must be array of 2 cards)" },
        { status: 400 }
      )
    }

    const result = computeEquity(body)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
