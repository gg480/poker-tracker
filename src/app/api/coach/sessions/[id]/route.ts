import { NextRequest, NextResponse } from "next/server"
import { getSessionWithDecisions } from "@/services/coach-service"
import { deleteCoachSession } from "@/storage/database/crud"
import { respond, badRequestResponse } from "@/services/crud-service"

// GET /api/coach/sessions/[id] — 获取会话详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing session id" },
        { status: 400 }
      )
    }

    const result = getSessionWithDecisions(id)

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE /api/coach/sessions/[id] — 删除训练会话（级联删除决策和反馈）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return respond(async () => {
    const { id } = await params
    if (!id) {
      return badRequestResponse("Missing session id")
    }
    const deleted = deleteCoachSession(id)
    if (!deleted) {
      return badRequestResponse("Session not found")
    }
    return { message: "Session deleted", session: deleted }
  })
}
