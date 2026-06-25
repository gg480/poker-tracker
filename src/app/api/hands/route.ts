import { NextRequest } from "next/server";
import { getHandsPaginated, insertHandRecord, updateHandRecord, deleteHandRecord } from "@/storage/database/crud";
import {
  createHandRecordSchema,
  updateHandRecordSchema,
  parsePaginationParams,
} from "../_validators";
import { respond, respondWithParse, badRequestResponse } from "@/services/crud-service";

export function GET(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    const seasonId = searchParams.get("season_id");
    const sessionId = searchParams.get("session_id");
    const isCompleteParam = searchParams.get("is_complete");
    const isComplete = isCompleteParam !== null ? isCompleteParam === "true" : undefined;

    return getHandsPaginated(
      {
        seasonId: seasonId || undefined,
        sessionId: sessionId || undefined,
        isComplete,
      },
      page,
      limit,
    );
  });
}

export async function POST(request: NextRequest) {
  return respondWithParse(request, createHandRecordSchema, insertHandRecord);
}

export async function PUT(request: NextRequest) {
  return respondWithParse(request, updateHandRecordSchema, ({ id, ...updates }) =>
    updateHandRecord(id, updates)
  );
}

export async function DELETE(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return badRequestResponse("Missing id");
    }

    return deleteHandRecord(id);
  });
}
