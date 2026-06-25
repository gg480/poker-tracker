import { NextRequest } from "next/server";
import { getRecordsPaginated, insertRecords, deleteRecordsByDate, updatePokerRecord, deletePokerRecord } from "@/storage/database/crud";
import {
  createRecordsSchema,
  deletePokerRecordOrByDateSchema,
  updatePokerRecordSchema,
  parsePaginationParams,
} from "../_validators";
import { respond, respondWithParse } from "@/services/crud-service";

export async function GET(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const seasonId = searchParams.get("season_id");
    const sessionId = searchParams.get("session_id");

    return getRecordsPaginated(
      {
        seasonId: seasonId || undefined,
        sessionId: sessionId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      page,
      limit,
    );
  });
}

export async function POST(request: NextRequest) {
  return respondWithParse(request, createRecordsSchema, insertRecords);
}

export async function PUT(request: NextRequest) {
  return respondWithParse(request, updatePokerRecordSchema, ({ id, ...updates }) => updatePokerRecord(id, updates));
}

export async function DELETE(request: NextRequest) {
  return respondWithParse(request, deletePokerRecordOrByDateSchema, (parsed) => {
    if ("id" in parsed) {
      return deletePokerRecord(parsed.id);
    }
    return deleteRecordsByDate(parsed.date);
  });
}
