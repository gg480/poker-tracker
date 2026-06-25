import { NextRequest } from "next/server";
import { getAwardsBySeason, getAwardsPaginated, insertAwardRecord, insertAwardRecords, updateAwardRecord, deleteAwardRecord, deleteAwardRecordsBySeason } from "@/storage/database/crud";
import {
  createAwardRecordOrRecordsSchema,
  deleteAwardRecordSchema,
  updateAwardRecordSchema,
  parsePaginationParams,
} from "../_validators";
import { respond, respondWithParse, badRequestResponse } from "@/services/crud-service";

export function GET(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("season_id") || undefined;
    const { page, limit } = parsePaginationParams(searchParams);

    return getAwardsPaginated(seasonId, page, limit);
  });
}

export async function POST(request: NextRequest) {
  return respondWithParse(request, createAwardRecordOrRecordsSchema, (parsed) => {
    if (Array.isArray(parsed)) {
      return insertAwardRecords(parsed);
    }
    return insertAwardRecord(parsed);
  });
}

export async function PUT(request: NextRequest) {
  return respondWithParse(request, updateAwardRecordSchema, ({ id, ...updates }) =>
    updateAwardRecord(id, updates)
  );
}

export function DELETE(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const seasonId = searchParams.get("season_id");

    if (id && seasonId) {
      return badRequestResponse("Provide either id or season_id, not both");
    }

    if (id) {
      deleteAwardRecordSchema.parse({ id });
      return deleteAwardRecord(id);
    }

    if (seasonId) {
      deleteAwardRecordsBySeason(seasonId);
      return;
    }

    return badRequestResponse("Missing id or season_id");
  });
}
