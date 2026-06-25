import { NextRequest, NextResponse } from "next/server"
import { recordDecision } from "@/services/coach-service"
import {
  deleteCoachDecision,
  getDecisionById,
  updateCoachDecision,
} from "@/storage/database/crud"
import { respond, respondWithParse, badRequestResponse } from "@/services/crud-service"
import { z } from "zod"
import type { RecordDecisionRequest } from "@/lib/coach/types"

// Zod schema for PATCH — partial update of a coach decision's evaluation fields
const updateDecisionSchema = z.object({
  decisionId: z.string().min(1, "decisionId is required"),
  isCorrect: z.boolean().optional(),
  deviation: z.number().min(0).max(1).optional(),
  gtoRecommendation: z.string().max(10).optional(),
  gtoFrequency: z.number().min(0).max(1).optional(),
})

// POST /api/coach/sessions/[id]/decisions — 记录决策
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as RecordDecisionRequest

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing session id" },
        { status: 400 }
      )
    }

    // 验证必要字段
    if (!body.street || !body.handNumber || !body.holeCards || !body.userAction) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = recordDecision(id, body)

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

// DELETE /api/coach/sessions/[id]/decisions?decisionId=xxx — 删除单个决策
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return respond(async () => {
    const { id: _sessionId } = await params
    const { searchParams } = new URL(request.url)
    const decisionId = searchParams.get("decisionId")

    if (!decisionId) {
      return badRequestResponse("Missing query parameter: decisionId")
    }

    const existing = getDecisionById(decisionId)
    if (!existing) {
      return badRequestResponse("Decision not found")
    }

    const deleted = deleteCoachDecision(decisionId)
    return { message: "Decision deleted", decision: deleted }
  })
}

// PATCH /api/coach/sessions/[id]/decisions — 更新决策（覆盖评估或添加备注）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params // validate session id resolves
  return respondWithParse(request, updateDecisionSchema, (data) => {
    const { decisionId, ...updates } = data

    const existing = getDecisionById(decisionId)
    if (!existing) {
      return badRequestResponse("Decision not found")
    }

    const updated = updateCoachDecision(decisionId, updates)
    return { message: "Decision updated", decision: updated }
  })
}
