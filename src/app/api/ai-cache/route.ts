import { NextRequest } from "next/server";
import { getAICachePaginated, insertAICache, updateAICache, deleteAICache, trimAICache } from "@/storage/database/crud";
import {
  createAICacheSchema,
  updateAICacheSchema,
  deleteAICacheSchema,
  parsePaginationParams,
} from "../_validators";
import { respond, respondWithParse } from "@/services/crud-service";

export async function GET(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    return getAICachePaginated(page, limit);
  });
}

export async function POST(request: NextRequest) {
  return respondWithParse(request, createAICacheSchema, (cache) => {
    const data = insertAICache(cache);
    trimAICache(3);
    return data;
  });
}

export async function PUT(request: NextRequest) {
  return respondWithParse(request, updateAICacheSchema, ({ id, result }) => {
    const data = updateAICache(id, result);
    trimAICache(3);
    return data;
  });
}

export async function DELETE(request: NextRequest) {
  return respondWithParse(request, deleteAICacheSchema, ({ id }) => {
    const data = deleteAICache(id);
    return data;
  });
}
