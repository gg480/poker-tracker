// ========================================================================
// POST /api/seasons/[id]/end  — End a season (full orchestrator)
// GET  /api/seasons/[id]/end  — Preview whether a season can be ended
// ========================================================================

import { NextRequest, NextResponse } from "next/server"
import {
  previewEndSeason,
  endSeason,
} from "@/services/season-end-service"
import { badRequestResponse } from "@/services/crud-service"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const preview = previewEndSeason(id)
    if (!preview) {
      return badRequestResponse(`Season ${id} not found`)
    }
    return NextResponse.json({ success: true, data: preview })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = endSeason(id)
    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
