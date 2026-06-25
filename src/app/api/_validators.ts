import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ==================== Custom Error ====================

export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super("Validation failed");
    this.name = "ValidationError";
    this.issues = issues;
  }
}

// ==================== Reusable Primitives ====================

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const playerName = z
  .string()
  .min(1, "Player name is required")
  .max(50, "Player name must not exceed 50 characters");

const seasonId = z
  .string()
  .min(1, "Season ID is required");

const sessionId = z
  .string()
  .min(1, "Session ID is required");

// ==================== Seasons ====================

const seasonName = z
  .string()
  .min(1, "Season name is required")
  .max(50, "Season name must not exceed 50 characters");

export const createSeasonSchema = z.object({
  name: seasonName,
  startDate: dateStr,
  endDate: dateStr.optional(),
  active: z.boolean().optional().default(true),
  archived: z.boolean().optional().default(false),
});

export const updateSeasonSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: seasonName.optional(),
  startDate: dateStr.optional(),
  endDate: dateStr.optional().nullable(),
  active: z.boolean().optional(),
  archived: z.boolean().optional(),
});

// ==================== Poker Records ====================

export const createRecordSchema = z.object({
  date: dateStr,
  seasonId,
  sessionId: sessionId.optional().nullable(),
  player: playerName,
  score: z.number().int("Score must be an integer"),
  win: z.union([z.literal(1), z.literal(-1)], {
    message: "Win must be 1 or -1",
  }),
  status: z
    .enum(["pending", "confirmed"])
    .optional()
    .default("pending"),
  notes: z.string().optional().nullable(),
});

export const createRecordsSchema = z
  .array(createRecordSchema)
  .min(1, "At least one record is required");

export const deleteRecordsByDateSchema = z.object({
  date: dateStr,
});

export const updatePokerRecordSchema = z.object({
  id: z.string().min(1, "ID is required"),
  date: dateStr.optional(),
  seasonId: seasonId.optional(),
  sessionId: sessionId.optional().nullable(),
  player: playerName.optional(),
  score: z.number().int("Score must be an integer").optional(),
  win: z.union([z.literal(1), z.literal(-1)], {
    message: "Win must be 1 or -1",
  }).optional(),
  status: z
    .enum(["pending", "confirmed"])
    .optional(),
  notes: z.string().optional().nullable(),
});

export const deletePokerRecordSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const deletePokerRecordOrByDateSchema = z.union([
  deletePokerRecordSchema,
  deleteRecordsByDateSchema,
]);

// ==================== Game Sessions ====================

export const createSessionSchema = z.object({
  date: dateStr,
  seasonId,
});

export const addEntryActionSchema = z.object({
  action: z.literal("add_entry"),
  sessionId,
  player: playerName,
  score: z.number().int("Score must be an integer"),
  seasonId,
  date: dateStr,
});

export const findOrCreateActionSchema = z.object({
  action: z.literal("find_or_create"),
  date: dateStr,
  seasonId,
});

export const batchEntriesActionSchema = z.object({
  action: z.literal("batch_entries"),
  sessionId,
  entries: z
    .array(
      z.object({
        player: playerName,
        score: z.number().int("Score must be an integer"),
      })
    )
    .min(1, "At least one entry is required"),
  seasonId,
  date: dateStr,
});

export const sessionIdActionSchema = z.object({
  action: z.enum(["collect", "confirm", "revert", "validate"]),
  sessionId,
});

export const deleteSessionSchema = z.object({
  id: z.string().min(1, "Session ID is required"),
});

// ==================== Session Updates ====================

export const updateSessionSchema = z.object({
  id: sessionId,
  date: dateStr.optional(),
  seasonId: seasonId.optional(),
});

// ==================== Player Settlements ====================

export const upsertSettlementSchema = z.object({
  id: z.string().optional(),
  player: playerName,
  seasonId,
  settleScore: z.number().int("Settle score must be an integer").optional().default(0),
  seasonAdjust: z.number().int("Season adjust must be an integer").optional().default(0),
});

export const deleteSettlementSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const updateSettlementSchema = z.object({
  id: z.string().min(1, "ID is required"),
  player: playerName.optional(),
  seasonId: seasonId.optional(),
  settleScore: z.number().int("Settle score must be an integer").optional(),
  seasonAdjust: z.number().int("Season adjust must be an integer").optional(),
});

// ==================== Clear Records ====================

export const createClearRecordSchema = z.object({
  date: dateStr,
  player: playerName,
  amount: z.number().int("Amount must be an integer"),
  seasonId,
  clearType: z.enum(["threshold", "season_end"], {
    message: "Clear type must be 'threshold' or 'season_end'",
  }).default("threshold"),
  note: z.string().max(500, "Note must not exceed 500 characters").optional(),
});

export const deleteClearRecordSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const updateClearRecordSchema = z.object({
  id: z.string().min(1, "ID is required"),
  date: dateStr.optional(),
  player: playerName.optional(),
  amount: z.number().int("Amount must be an integer").optional(),
  seasonId: seasonId.optional(),
  clearType: z
    .enum(["threshold", "season_end"], {
      message: "Clear type must be 'threshold' or 'season_end'",
    })
    .optional(),
  note: z.string().max(500, "Note must not exceed 500 characters").optional(),
});

// ==================== Hand Records ====================

export const createHandRecordSchema = z.object({
  date: dateStr,
  seasonId,
  sessionId: sessionId.optional().nullable(),
  players: z.string().min(1, "Players is required"),
  handType: z
    .string()
    .max(20, "Hand type must not exceed 20 characters")
    .optional()
    .nullable(),
  board: z.string().optional().nullable(),
  actions: z.string().optional().nullable(),
  result: z.number().int("Result must be an integer").optional().nullable(),
  winner: playerName.optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  gtoAnalysis: z.string().optional().nullable(),
  isComplete: z.boolean().optional().default(false),
  quickMode: z.boolean().optional().default(false),
});

export const updateHandRecordSchema = z.object({
  id: z.string().min(1, "ID is required"),
  date: dateStr.optional(),
  seasonId: seasonId.optional(),
  sessionId: sessionId.optional().nullable(),
  players: z.string().optional(),
  handType: z
    .string()
    .max(20, "Hand type must not exceed 20 characters")
    .optional()
    .nullable(),
  board: z.string().optional().nullable(),
  actions: z.string().optional().nullable(),
  result: z.number().int("Result must be an integer").optional().nullable(),
  winner: playerName.optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  gtoAnalysis: z.string().optional().nullable(),
  isComplete: z.boolean().optional(),
  quickMode: z.boolean().optional(),
});

// ==================== Award Records ====================

export const createAwardRecordSchema = z.object({
  seasonId,
  player: playerName,
  awardType: z
    .string()
    .min(1, "Award type is required")
    .max(50, "Award type must not exceed 50 characters"),
  awardName: z
    .string()
    .min(1, "Award name is required")
    .max(50, "Award name must not exceed 50 characters"),
  awardIcon: z
    .string()
    .min(1, "Award icon is required")
    .max(30, "Award icon must not exceed 30 characters"),
  description: z.string().optional().nullable(),
});

export const createAwardRecordsSchema = z
  .array(createAwardRecordSchema)
  .min(1, "At least one award record is required");

export const createAwardRecordOrRecordsSchema = z.union([
  createAwardRecordsSchema,
  createAwardRecordSchema,
]);

export const deleteAwardRecordSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const updateAwardRecordSchema = z.object({
  id: z.string().min(1, "ID is required"),
  seasonId: seasonId.optional(),
  player: playerName.optional(),
  awardType: z
    .string()
    .min(1, "Award type is required")
    .max(50, "Award type must not exceed 50 characters")
    .optional(),
  awardName: z
    .string()
    .min(1, "Award name is required")
    .max(50, "Award name must not exceed 50 characters")
    .optional(),
  awardIcon: z
    .string()
    .min(1, "Award icon is required")
    .max(30, "Award icon must not exceed 30 characters")
    .optional(),
  description: z.string().optional().nullable(),
});

// ==================== AI Cache ====================

export const createAICacheSchema = z.object({
  label: z
    .string()
    .min(1, "Label is required")
    .max(100, "Label must not exceed 100 characters"),
  prompt: z.string().min(1, "Prompt is required"),
  result: z.string().min(1, "Result is required"),
  time: z
    .string()
    .min(1, "Time is required")
    .max(50, "Time must not exceed 50 characters"),
});

export const updateAICacheSchema = z.object({
  id: z.string().min(1, "ID is required"),
  result: z.string().min(1, "Result is required"),
});

export const deleteAICacheSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

// ==================== Import/Export ====================

export const importJsonSchema = z.object({
  version: z.string().optional(),
  exportedAt: z.string().optional(),
  seasons: z.array(z.any()).optional(),
  gameSessions: z.array(z.any()).optional(),
  pokerRecords: z.array(z.any()).optional(),
  playerSettlements: z.array(z.any()).optional(),
  clearRecords: z.array(z.any()).optional(),
  handRecords: z.array(z.any()).optional(),
  awardRecords: z.array(z.any()).optional(),
});

// ==================== Pagination ====================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive("Page must be a positive integer").optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive("Limit must be a positive integer")
    .max(100, "Limit must not exceed 100")
    .optional()
    .default(50),
});

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Parse pagination query params (page, limit) from a URLSearchParams.
 * Throws ValidationError if values are invalid.
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
} {
  const result = paginationSchema.safeParse({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  });
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}

// ==================== Utility Functions ====================

/**
 * Parse and validate the JSON body of a request against a Zod schema.
 * Throws ValidationError on failure, which the caller should catch and
 * handle with validationErrorResponse().
 */
export async function parseBody<T>(request: NextRequest, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError([{
      code: "custom",
      path: [],
      message: "Invalid JSON body",
    } as z.ZodIssue]);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }

  return result.data;
}

/**
 * Build a NextResponse for validation errors with field-level detail.
 */
export function validationErrorResponse(error: ValidationError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      details: error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
        message: issue.message,
        code: issue.code,
      })),
    },
    { status: 400 }
  );
}
