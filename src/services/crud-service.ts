// ========================================================================
// crud-service.ts — Thin service layer for CRUD API route handlers
//
// What this IS:
//  - A wrapper that eliminates the try-catch + ValidationError + NextResponse
//    boilerplate repeated in every API route handler
//  - Pure utility functions — no state, no classes, no ORM abstraction
//
// What this is NOT:
//  - NOT an ORM wrapper — Drizzle CRUD functions are called directly
//  - NOT a repository pattern — no abstract interfaces or base classes
//  - NOT a schema definition — Zod schemas stay in _validators.ts
//
// Usage:
//   respond(() => insertSeason(data))
//   respondWithParse(request, createSeasonSchema, (data) => insertSeason(data))
//   respondWithParse(request, createSeasonSchema, insertSeason)  // shorthand
// ========================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ValidationError,
  validationErrorResponse,
  parseBody,
} from "@/app/api/_validators";

// ========================================================================
// Internal helpers
// ========================================================================

/**
 * Turn a handler's return value into a standard response.
 * - `NextResponse` (from badRequestResponse) → pass through
 * - `undefined` → { success: true }
 * - anything else → { success: true, data: <value> }
 *
 * The pass-through lets handlers return custom responses (badRequestResponse)
 * from inside `respond()`, so callers don't have to fall back to raw
 * NextResponse.json for edge cases.
 */
function toSuccessResponse(result: unknown): NextResponse {
  if (result instanceof NextResponse) {
    return result;
  }
  if (result === undefined) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: true, data: result });
}

/**
 * Unified error handling for the three error types seen across the codebase:
 *  1. ValidationError (zod via parseBody)
 *  2. z.ZodError (direct safeParse in route handlers)
 *  3. Everything else (generic 500)
 */
function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return validationErrorResponse(error);
  }
  if (error instanceof z.ZodError) {
    return validationErrorResponse(new ValidationError(error.issues));
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

// ========================================================================
// Public API
// ========================================================================

/**
 * Wrap a synchronous or asynchronous handler with standard try-catch +
 * error formatting.
 *
 * The handler returns the data payload (or undefined for void operations).
 * If the handler returns a Promise, `respond` awaits it transparently.
 * Errors are caught and formatted the same way across every route.
 *
 * ```ts
 * // Before (14 lines per handler):
 * export async function GET() {
 *   try {
 *     const data = getAllSeasons()
 *     return NextResponse.json({ success: true, data })
 *   } catch (error) {
 *     if (error instanceof ValidationError) { return validationErrorResponse(error) }
 *     const msg = error instanceof Error ? error.message : "Unknown"
 *     return NextResponse.json({ success: false, error: msg }, { status: 500 })
 *   }
 * }
 *
 * // After (3 lines):
 * export async function GET() {
 *   return respond(() => getAllSeasons())
 * }
 *
 * // Async handler (3 lines):
 * export async function POST() {
 *   return respond(async () => {
 *     const data = await fetchSomeData()
 *     return data
 *   })
 * }
 * ```
 */
export function respond<T>(
  handler: () => T | Promise<T>
): NextResponse | Promise<NextResponse> {
  try {
    const result = handler();
    if (result instanceof Promise) {
      return result.then(toSuccessResponse).catch(toErrorResponse);
    }
    return toSuccessResponse(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Parse the request body with a Zod schema, then call the handler.
 * Combines `parseBody` + `respond` into a single call.
 *
 * ```ts
 * // Before (16 lines):
 * export async function POST(request: NextRequest) {
 *   try {
 *     const season = await parseBody(request, createSeasonSchema)
 *     const data = insertSeason(season)
 *     return NextResponse.json({ success: true, data })
 *   } catch (error) {
 *     if (error instanceof ValidationError) { ... }
 *     ...
 *   }
 * }
 *
 * // After (2 lines):
 * export async function POST(request: NextRequest) {
 *   return respondWithParse(request, createSeasonSchema, insertSeason)
 * }
 * ```
 */
export async function respondWithParse<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
  handler: (parsed: T) => unknown
): Promise<NextResponse> {
  try {
    const parsed = await parseBody(request, schema);
    return toSuccessResponse(handler(parsed));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Return a 400 Bad Request response with a custom message.
 * Use when a route needs to reject a request before schema validation
 * (e.g. missing required query parameters).
 *
 * ```ts
 * if (!seasonId) {
 *   return badRequestResponse("Missing season_id")
 * }
 * ```
 */
export function badRequestResponse(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 400 });
}
