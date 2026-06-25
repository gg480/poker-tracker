import { NextRequest } from "next/server"
import { getAdvice } from "@/services/coach-service"
import { respond, badRequestResponse } from "@/services/crud-service"
import type { AdviceQuery } from "@/lib/coach/types"

// GET /api/coach/sessions/[id]/advice — 获取 GTO 建议（不保存）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return respond(() => {
    const { searchParams } = new URL(request.url)

    const street = searchParams.get("street") as AdviceQuery["street"]
    const holeCards = searchParams.get("holeCards")?.split(",") || []
    const boardCards = searchParams.get("boardCards")?.split(",") || []
    const potSize = parseInt(searchParams.get("potSize") || "0", 10)
    const position = (searchParams.get("position") as AdviceQuery["position"]) || undefined

    if (!street || holeCards.length === 0) {
      return badRequestResponse("Missing required fields: street, holeCards")
    }

    return getAdvice({
      street,
      holeCards,
      boardCards,
      potSize,
      position,
    })
  })
}
