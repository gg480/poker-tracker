import { NextRequest, NextResponse } from "next/server"
import {
  createSession,
  findOrCreateSession,
  addPlayerEntry,
  addBatchEntries,
  confirmSession,
  deleteSessionById,
  getSessions,
  getSessionDetail,
} from "@/services/session-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("season_id")
    const id = searchParams.get("id")
    const detail = searchParams.get("detail")

    if (id && detail === "true") {
      const result = getSessionDetail(id)
      return NextResponse.json({ success: true, data: result })
    }

    if (id) {
      const result = getSessionDetail(id)
      return NextResponse.json({ success: true, data: result.session })
    }

    const data = getSessions(seasonId || undefined)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.action === "add_entry") {
      const { sessionId, player, score, seasonId, date } = body
      const result = addPlayerEntry(sessionId, player, score, seasonId, date)
      return NextResponse.json({ success: true, data: result })
    }

    if (body.action === "find_or_create") {
      const { date, seasonId } = body
      const data = findOrCreateSession(date, seasonId)
      return NextResponse.json({ success: true, data })
    }

    if (body.action === "batch_entries") {
      const { sessionId, entries, seasonId, date } = body
      const result = addBatchEntries(sessionId, entries, seasonId, date)
      return NextResponse.json({ success: true, data: result })
    }

    if (body.action === "confirm") {
      const { sessionId } = body
      const result = confirmSession(sessionId)
      return NextResponse.json({ success: true, data: result })
    }

    if (body.action === "validate") {
      const { sessionId } = body
      const { validateSession } = require("@/services/session-service")
      const result = validateSession(sessionId)
      return NextResponse.json({ success: true, data: result })
    }

    const { date, seasonId } = body
    const data = createSession(date, seasonId)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 })
    }
    const result = deleteSessionById(id)
    return NextResponse.json({ success: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
