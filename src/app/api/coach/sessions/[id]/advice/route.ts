import { NextRequest, NextResponse } from "next/server"
import { getAdvice } from "@/services/coach-service"
import type { AdviceQuery } from "@/lib/coach/types"

// GET /api/coach/sessions/[id]/advice — 获取 GTO 建议（不保存）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)

    const street = searchParams.get("street") as AdviceQuery["street"]
    const holeCards = searchParams.get("holeCards")?.split(",") || []
    const boardCards = searchParams.get("boardCards")?.split(",") || []
    const potSize = parseInt(searchParams.get("potSize") || "0", 10)
    const position = (searchParams.get("position") as AdviceQuery["position"]) || undefined

    if (!street || holeCards.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: street, holeCards" },
        { status: 400 }
      )
    }

    const result = getAdvice({
      street,
      holeCards,
      boardCards,
      potSize,
      position,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
