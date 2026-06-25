import { NextRequest } from "next/server";
import {
  getClearsPaginated,
  insertClearRecord,
  updateClearRecord,
  deleteClearRecord,
  deleteClearsBySeason,
  getRecordsBySeason,
  getSettlementsBySeason,
  getClearsBySeason,
} from "@/storage/database/crud";
import {
  createClearRecordSchema,
  deleteClearRecordSchema,
  updateClearRecordSchema,
  parsePaginationParams,
} from "../_validators";
import { respond, respondWithParse, badRequestResponse } from "@/services/crud-service";
import { getClearRadarAlerts } from "@/services/clear-radar-service";

export async function GET(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // 清分预警：聚合玩家积分 + 结算信息 → 生成预警列表
    if (action === "warnings") {
      const seasonId = searchParams.get("season_id");
      if (!seasonId) return badRequestResponse("season_id is required for warnings");

      const allRecords = getRecordsBySeason(seasonId);
      const settlements = getSettlementsBySeason(seasonId);
      const clears = getClearsBySeason(seasonId);

      // 聚合玩家积分
      const scoreMap = new Map<string, number>();
      for (const r of allRecords) {
        if (r.status === "pending") continue; // 仅统计已确认记录
        scoreMap.set(r.player, (scoreMap.get(r.player) || 0) + r.score);
      }
      const playerStats = Array.from(scoreMap, ([name, total]) => ({ name, total }));

      // 构建每个玩家最近清分日期索引
      const clearRecordDates: Record<string, string> = {};
      for (const c of clears) {
        const key = `${c.player}-${c.seasonId}`;
        if (!clearRecordDates[key] || c.date > clearRecordDates[key]) {
          clearRecordDates[key] = c.date;
        }
      }

      return getClearRadarAlerts(playerStats, seasonId, settlements, clearRecordDates);
    }

    // 默认：分页查询清分记录
    const { page, limit } = parsePaginationParams(searchParams);
    const seasonId = searchParams.get("season_id");
    return getClearsPaginated(seasonId || undefined, page, limit);
  });
}

export async function POST(request: NextRequest) {
  return respondWithParse(request, createClearRecordSchema, insertClearRecord);
}

export async function PUT(request: NextRequest) {
  return respondWithParse(request, updateClearRecordSchema, ({ id, ...updates }) => updateClearRecord(id, updates));
}

export async function DELETE(request: NextRequest) {
  return respond(() => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const seasonId = searchParams.get("season_id");

    if (id && seasonId) {
      return badRequestResponse("Provide either id or season_id, not both");
    }

    if (id) {
      deleteClearRecordSchema.parse({ id });
      return deleteClearRecord(id);
    }

    if (seasonId) {
      deleteClearsBySeason(seasonId);
      return undefined;
    }

    return badRequestResponse("Missing id or season_id");
  });
}
