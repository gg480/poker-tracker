import { NextRequest } from "next/server";
import { getAllSeasonsPaginated, insertSeason, updateSeason, deleteSeason } from "@/storage/database/crud";
import {
  createSeasonSchema,
  updateSeasonSchema,
  parsePaginationParams,
} from "../_validators";
import { respond, respondWithParse, badRequestResponse } from "@/services/crud-service";

export async function GET(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    return getAllSeasonsPaginated(page, limit);
  });
}

export async function POST(request: NextRequest) {
  return respondWithParse(request, createSeasonSchema, insertSeason);
}

export async function PUT(request: NextRequest) {
  return respondWithParse(request, updateSeasonSchema, ({ id, ...updates }) => updateSeason(id, updates));
}

export async function DELETE(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return badRequestResponse("Missing id");
    }

    return deleteSeason(id);
  });
}
