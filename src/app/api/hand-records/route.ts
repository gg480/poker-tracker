import { NextRequest } from "next/server"
import { getHandsPaginated, getHandsBySession } from "@/storage/database/crud"
import { parsePaginationParams } from "../_validators"
import { respond } from "@/services/crud-service"

export async function GET(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (sessionId) {
      return getHandsBySession(sessionId)
    }

    const { page, limit } = parsePaginationParams(searchParams)
    const seasonId = searchParams.get("season_id") || undefined

    return getHandsPaginated(
      { seasonId, isComplete: undefined },
      page,
      limit,
    )
  })
}
