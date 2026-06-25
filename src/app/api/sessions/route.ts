import { NextRequest } from "next/server"
import {
  createSession,
  findOrCreateSession,
  addPlayerEntry,
  addBatchEntries,
  collectSession,
  confirmSession,
  revertToCollected,
  deleteSessionById,
  getSessionDetail,
  validateSession,
} from "@/services/session-service"
import { getSessionsPaginated, updateSession } from "@/storage/database/crud"
import {
  createSessionSchema,
  updateSessionSchema,
  addEntryActionSchema,
  findOrCreateActionSchema,
  batchEntriesActionSchema,
  sessionIdActionSchema,
  deleteSessionSchema,
  parsePaginationParams,
} from "../_validators"
import { respond, respondWithParse, badRequestResponse } from "@/services/crud-service"

export async function GET(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("season_id")
    const id = searchParams.get("id")
    const detail = searchParams.get("detail")

    if (id && detail === "true") {
      return getSessionDetail(id)
    }

    if (id) {
      return getSessionDetail(id).session
    }

    const { page, limit } = parsePaginationParams(searchParams)
    return getSessionsPaginated(seasonId || undefined, page, limit)
  })
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  return respond(() => {
    const body = rawBody as Record<string, unknown>;
    const action = body?.action as string | undefined;

    if (action === "add_entry") {
      const { sessionId, player, score, seasonId, date } = addEntryActionSchema.parse(body);
      return addPlayerEntry(sessionId, player, score, seasonId, date);
    }

    if (action === "find_or_create") {
      const { date, seasonId } = findOrCreateActionSchema.parse(body);
      return findOrCreateSession(date, seasonId);
    }

    if (action === "batch_entries") {
      const { sessionId, entries, seasonId, date } = batchEntriesActionSchema.parse(body);
      return addBatchEntries(sessionId, entries.map(e => ({ ...e, entered: false })), seasonId, date);
    }

    if (action === "collect" || action === "confirm" || action === "revert" || action === "validate") {
      const { action: validatedAction, sessionId } = sessionIdActionSchema.parse(body);
      switch (validatedAction) {
        case "collect": return collectSession(sessionId);
        case "confirm": return confirmSession(sessionId);
        case "revert": return revertToCollected(sessionId);
        case "validate": return validateSession(sessionId);
      }
    }

    // If an action was explicitly provided but didn't match, reject it rather
    // than silently falling through to "create session" (which would ignore
    // the unknown action and act on the remaining fields).
    if (typeof action === "string" && action.length > 0) {
      return badRequestResponse(`Unknown action: "${action}"`);
    }

    // Default: create session without action
    const { date, seasonId } = createSessionSchema.parse(body);
    return createSession(date, seasonId);
  });
}

export async function PUT(request: NextRequest) {
  return respondWithParse(request, updateSessionSchema, ({ id, ...updates }) =>
    updateSession(id, updates)
  );
}

export async function DELETE(request: NextRequest) {
  return respondWithParse(request, deleteSessionSchema, ({ id }) => deleteSessionById(id));
}
