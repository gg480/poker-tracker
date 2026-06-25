import { NextRequest } from "next/server";
import { getSettlementsPaginated, upsertSettlement, updateSettlement, deleteSettlement, deleteSettlementsBySeason } from "@/storage/database/crud";
import {
  upsertSettlementSchema,
  updateSettlementSchema,
  deleteSettlementSchema,
  parsePaginationParams,
} from "../_validators";
import { respond, respondWithParse, badRequestResponse } from "@/services/crud-service";

export function GET(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    const seasonId = searchParams.get("season_id");

    return getSettlementsPaginated(seasonId || undefined, page, limit);
  });
}

export async function POST(request: NextRequest) {
  return respondWithParse(request, upsertSettlementSchema, upsertSettlement);
}

export async function PUT(request: NextRequest) {
  return respondWithParse(request, updateSettlementSchema, ({ id, ...updates }) =>
    updateSettlement(id, updates)
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
      deleteSettlementSchema.parse({ id });
      return deleteSettlement(id);
    }

    if (seasonId) {
      deleteSettlementsBySeason(seasonId);
      return;
    }

    return badRequestResponse("Missing id or season_id");
  });
}
