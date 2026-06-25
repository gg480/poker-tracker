import { NextRequest, NextResponse } from "next/server"
import { createSession, listSessions } from "@/services/coach-service"
import { parsePaginationParams } from "../../_validators"
import type { CreateSessionRequest } from "@/lib/coach/types"

// GET /api/coach/sessions — 获取会话列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit } = parsePaginationParams(searchParams)
    const status = searchParams.get("status") || undefined

    const result = listSessions(page, limit, status)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST /api/coach/sessions — 创建训练会话
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSessionRequest

    if (!body.mode) {
      return NextResponse.json(
        { success: false, error: "Missing required field: mode" },
        { status: 400 }
      )
    }

    const session = createSession(body)
    return NextResponse.json({ success: true, data: session }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
