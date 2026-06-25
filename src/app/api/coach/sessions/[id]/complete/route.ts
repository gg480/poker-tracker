import { NextRequest, NextResponse } from "next/server"
import { completeSession } from "@/services/coach-service"
import type { CompleteSessionRequest } from "@/lib/coach/types"

// POST /api/coach/sessions/[id]/complete — 完成训练
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as CompleteSessionRequest

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing session id" },
        { status: 400 }
      )
    }

    if (!body.action || !["complete", "abandon"].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'complete' or 'abandon'" },
        { status: 400 }
      )
    }

    const result = completeSession(id, body.action)

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
