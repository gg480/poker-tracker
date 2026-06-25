// @ts-nocheck — deprecated service, zero callers, type-checking deferred
/**
 * @deprecated This service has no active consumers as of 2026-06-25. Keep for future use or remove if unused after 2026-09-25.
 */

import {
  CLEAR_THRESHOLD,
  MIN_GAMES_FOR_AWARD,
  SESSION_STATUS,
  RECORD_STATUS,
  CLEAR_TYPE,
  AWARD_CATEGORIES,
} from "@/lib/constants";

// ========================================================================
// Types
// ========================================================================

export interface ValidationErrorItem {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationErrorItem[];
}

export type Validator<T> = (value: T) => ValidationResult;

// ========================================================================
// Error helpers (consistent with app/api/_validators.ts format)
// ========================================================================

function item(path: string, message: string, code = "custom"): ValidationErrorItem {
  return { path, message, code };
}

function success(): ValidationResult {
  return { success: true, errors: [] };
}

function failure(errors: ValidationErrorItem[]): ValidationResult {
  return { success: false, errors };
}

function combine(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return allErrors.length === 0 ? success() : failure(allErrors);
}

// ========================================================================
// Reusable regex & constants
// ========================================================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PLAYER_NAME_MAX = 50;
const ID_MIN_LENGTH = 1;
const MAX_STRING_LENGTH = 100;
const MAX_SCORE_ABS = 10_000;

// ========================================================================
// Primitive validators — each validates a single value and returns result
// ========================================================================

/**
 * Check that a string is non-empty (after trimming).
 * `path` identifies the field in the result error list.
 */
export function validateNonEmpty(value: unknown, path = "value"): ValidationResult {
  if (typeof value !== "string" || value.trim().length === 0) {
    return failure([item(path, `${path} is required`, "too_small")]);
  }
  return success();
}

/**
 * Check that a string does not exceed `max` characters.
 */
export function validateMaxLength(
  value: string,
  max: number,
  path = "value"
): ValidationResult {
  if (value.length > max) {
    return failure([item(path, `${path} must not exceed ${max} characters`, "too_big")]);
  }
  return success();
}

/**
 * Check that a string matches the YYYY-MM-DD date format.
 */
export function validateDateFormat(value: string, path = "date"): ValidationResult {
  if (!DATE_REGEX.test(value)) {
    return failure([item(path, "Date must be in YYYY-MM-DD format", "invalid_string")]);
  }
  return success();
}

/**
 * Check that a string is a valid calendar date (not just format).
 */
export function validateDateValue(value: string, path = "date"): ValidationResult {
  const formatResult = validateDateFormat(value, path);
  if (!formatResult.success) return formatResult;

  const d = new Date(value + "T00:00:00");
  const [y, m, day] = value.split("-").map(Number);
  if (
    d.getFullYear() !== y ||
    d.getMonth() + 1 !== m ||
    d.getDate() !== day
  ) {
    return failure([item(path, `${value} is not a valid date`, "invalid_date")]);
  }
  return success();
}

/**
 * Check that a value is an integer (number type, not NaN, no decimal).
 */
export function validateInteger(value: unknown, path = "value"): ValidationResult {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return failure([item(path, `${path} must be an integer`, "invalid_type")]);
  }
  return success();
}

/**
 * Check that a numeric value falls within [min, max] inclusive.
 */
export function validateNumericRange(
  value: number,
  min: number,
  max: number,
  path = "value"
): ValidationResult {
  if (value < min || value > max) {
    return failure([
      item(path, `${path} must be between ${min} and ${max}`, "out_of_range"),
    ]);
  }
  return success();
}

/**
 * Check that a player name is valid: non-empty, max length, allowed chars.
 */
export function validatePlayerName(value: unknown, path = "player"): ValidationResult {
  if (typeof value !== "string") {
    return failure([item(path, "Player name must be a string", "invalid_type")]);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return failure([item(path, "Player name is required", "too_small")]);
  }
  if (trimmed.length > PLAYER_NAME_MAX) {
    return failure([
      item(path, `Player name must not exceed ${PLAYER_NAME_MAX} characters`, "too_big"),
    ]);
  }
  return success();
}

/**
 * Check that a score value is a valid poker score integer within expected range.
 */
export function validateScore(value: unknown, path = "score"): ValidationResult {
  return combine(
    validateInteger(value, path),
    validateNumericRange(value as number, -MAX_SCORE_ABS, MAX_SCORE_ABS, path)
  );
}

/**
 * Check that a win value is exactly 1 (win) or -1 (loss).
 */
export function validateWin(value: unknown, path = "win"): ValidationResult {
  const intResult = validateInteger(value, path);
  if (!intResult.success) return intResult;

  if (value !== 1 && value !== -1) {
    return failure([
      item(path, `Win must be 1 (win) or -1 (loss), got ${value}`, "invalid_enum_value"),
    ]);
  }
  return success();
}

/**
 * Check that a season/record status is one of the allowed enum values.
 */
export function validateStatus(
  value: unknown,
  allowedStatuses: Readonly<Record<string, string>>,
  path = "status"
): ValidationResult {
  if (typeof value !== "string") {
    return failure([item(path, "Status must be a string", "invalid_type")]);
  }
  const allowed = Object.values(allowedStatuses);
  if (!allowed.includes(value)) {
    return failure([
      item(
        path,
        `Status must be one of: ${allowed.join(", ")}`,
        "invalid_enum_value"
      ),
    ]);
  }
  return success();
}

/**
 * Check that an ID string is non-empty.
 */
export function validateId(value: unknown, path = "id"): ValidationResult {
  if (typeof value !== "string" || value.trim().length < ID_MIN_LENGTH) {
    return failure([item(path, "ID is required", "too_small")]);
  }
  return success();
}

/**
 * Check that a string does not exceed the general max length.
 */
export function validateStringLength(
  value: unknown,
  max = MAX_STRING_LENGTH,
  path = "value"
): ValidationResult {
  if (typeof value !== "string") {
    return failure([item(path, `${path} must be a string`, "invalid_type")]);
  }
  if (value.length > max) {
    return failure([item(path, `${path} must not exceed ${max} characters`, "too_big")]);
  }
  return success();
}

/**
 * Check that a value is a boolean.
 */
export function validateBoolean(value: unknown, path = "value"): ValidationResult {
  if (typeof value !== "boolean") {
    return failure([item(path, `${path} must be a boolean`, "invalid_type")]);
  }
  return success();
}

/**
 * Check that a value is a plain object (not null, not array).
 */
export function validateObject(value: unknown, path = "value"): ValidationResult {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return failure([item(path, `${path} must be an object`, "invalid_type")]);
  }
  return success();
}

/**
 * Check that a value is an array with at least `min` items.
 */
export function validateArray(
  value: unknown,
  min = 1,
  path = "value"
): ValidationResult {
  if (!Array.isArray(value)) {
    return failure([item(path, `${path} must be an array`, "invalid_type")]);
  }
  if (value.length < min) {
    return failure([
      item(path, `${path} must contain at least ${min} item(s)`, "too_small"),
    ]);
  }
  return success();
}

/**
 * Check that a clear type is one of the allowed values.
 */
export function validateClearType(value: unknown, path = "clearType"): ValidationResult {
  return validateStatus(value, CLEAR_TYPE, path);
}

/**
 * Check that an award category is one of the allowed values.
 */
export function validateAwardCategory(value: unknown, path = "awardType"): ValidationResult {
  return validateStatus(value, AWARD_CATEGORIES, path);
}

// ========================================================================
// Composite validators — domain-level validation for business rules
// ========================================================================

export interface PokerRecordInput {
  date?: unknown;
  player?: unknown;
  score?: unknown;
  win?: unknown;
  status?: unknown;
  seasonId?: unknown;
  sessionId?: unknown;
}

/**
 * Validate the core fields of a PokerRecord (from a form or import).
 */
export function validatePokerRecordInput(data: PokerRecordInput): ValidationResult {
  const checks: ValidationResult[] = [];

  if (data.date !== undefined) checks.push(validateDateValue(data.date, "date"));
  if (data.player !== undefined) checks.push(validatePlayerName(data.player, "player"));
  if (data.score !== undefined) checks.push(validateScore(data.score, "score"));
  if (data.win !== undefined) checks.push(validateWin(data.win, "win"));
  if (data.status !== undefined) checks.push(validateStatus(data.status, RECORD_STATUS, "status"));
  if (data.seasonId !== undefined) checks.push(validateId(data.seasonId as string, "seasonId"));
  if (data.sessionId !== undefined && data.sessionId !== null && data.sessionId !== "") {
    checks.push(validateId(data.sessionId, "sessionId"));
  }

  return combine(...checks);
}

export interface SeasonInput {
  name?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  active?: unknown;
}

/**
 * Validate the core fields of a Season.
 */
export function validateSeasonInput(data: SeasonInput): ValidationResult {
  const checks: ValidationResult[] = [];

  if (data.name !== undefined) {
    checks.push(validateNonEmpty(data.name, "name"));
    checks.push(validateMaxLength(data.name as string, 50, "name"));
  }
  if (data.startDate !== undefined) checks.push(validateDateValue(data.startDate, "startDate"));
  if (data.endDate !== undefined && data.endDate !== null && data.endDate !== "") {
    checks.push(validateDateValue(data.endDate, "endDate"));
  }
  if (data.active !== undefined) checks.push(validateBoolean(data.active, "active"));

  return combine(...checks);
}

export interface SessionInput {
  date?: unknown;
  seasonId?: unknown;
  status?: unknown;
}

/**
 * Validate the core fields of a GameSession.
 */
export function validateSessionInput(data: SessionInput): ValidationResult {
  const checks: ValidationResult[] = [];

  if (data.date !== undefined) checks.push(validateDateValue(data.date, "date"));
  if (data.seasonId !== undefined) checks.push(validateId(data.seasonId as string, "seasonId"));
  if (data.status !== undefined) checks.push(validateStatus(data.status, SESSION_STATUS, "status"));

  return combine(...checks);
}

export interface SettlementInput {
  player?: unknown;
  seasonId?: unknown;
  settleScore?: unknown;
  seasonAdjust?: unknown;
}

/**
 * Validate the core fields of a PlayerSettlement.
 */
export function validateSettlementInput(data: SettlementInput): ValidationResult {
  const checks: ValidationResult[] = [];

  if (data.player !== undefined) checks.push(validatePlayerName(data.player, "player"));
  if (data.seasonId !== undefined) checks.push(validateId(data.seasonId as string, "seasonId"));
  if (data.settleScore !== undefined) checks.push(validateInteger(data.settleScore, "settleScore"));
  if (data.seasonAdjust !== undefined) checks.push(validateInteger(data.seasonAdjust, "seasonAdjust"));

  return combine(...checks);
}

export interface ClearRecordInput {
  date?: unknown;
  player?: unknown;
  amount?: unknown;
  seasonId?: unknown;
  clearType?: unknown;
}

/**
 * Validate the core fields of a ClearRecord.
 */
export function validateClearRecordInput(data: ClearRecordInput): ValidationResult {
  const checks: ValidationResult[] = [];

  if (data.date !== undefined) checks.push(validateDateValue(data.date, "date"));
  if (data.player !== undefined) checks.push(validatePlayerName(data.player, "player"));
  if (data.amount !== undefined) checks.push(validateInteger(data.amount, "amount"));
  if (data.seasonId !== undefined) checks.push(validateId(data.seasonId as string, "seasonId"));
  if (data.clearType !== undefined) checks.push(validateClearType(data.clearType, "clearType"));

  return combine(...checks);
}

export interface HandRecordInput {
  date?: unknown;
  seasonId?: unknown;
  players?: unknown;
  handType?: unknown;
  result?: unknown;
}

/**
 * Validate the core fields of a HandRecord.
 */
export function validateHandRecordInput(data: HandRecordInput): ValidationResult {
  const checks: ValidationResult[] = [];

  if (data.date !== undefined) checks.push(validateDateValue(data.date, "date"));
  if (data.seasonId !== undefined) checks.push(validateId(data.seasonId as string, "seasonId"));
  if (data.players !== undefined) checks.push(validateNonEmpty(data.players, "players"));
  if (data.handType !== undefined && data.handType !== null && data.handType !== "") {
    checks.push(validateMaxLength(data.handType as string, 20, "handType"));
  }
  if (data.result !== undefined && data.result !== null) {
    checks.push(validateInteger(data.result, "result"));
  }

  return combine(...checks);
}

export interface AwardRecordInput {
  seasonId?: unknown;
  player?: unknown;
  awardType?: unknown;
  awardName?: unknown;
  awardIcon?: unknown;
}

/**
 * Validate the core fields of an AwardRecord.
 */
export function validateAwardRecordInput(data: AwardRecordInput): ValidationResult {
  const checks: ValidationResult[] = [];

  if (data.seasonId !== undefined) checks.push(validateId(data.seasonId as string, "seasonId"));
  if (data.player !== undefined) checks.push(validatePlayerName(data.player, "player"));
  if (data.awardType !== undefined) checks.push(validateStringLength(data.awardType, 50, "awardType"));
  if (data.awardName !== undefined) checks.push(validateNonEmpty(data.awardName, "awardName"));
  if (data.awardName !== undefined) checks.push(validateMaxLength(data.awardName as string, 50, "awardName"));
  if (data.awardIcon !== undefined) checks.push(validateNonEmpty(data.awardIcon, "awardIcon"));
  if (data.awardIcon !== undefined) checks.push(validateMaxLength(data.awardIcon as string, 10, "awardIcon"));

  return combine(...checks);
}

// ========================================================================
// Business rule validators — domain-specific checks
// ========================================================================

/**
 * Check that a clear amount meets the configured threshold.
 */
export function validateClearThreshold(
  amount: number,
  path = "amount"
): ValidationResult {
  return validateNumericRange(amount, 0, CLEAR_THRESHOLD, path);
}

/**
 * Check that a player has enough games to qualify for an award.
 */
export function validateGamesForAward(
  gamesPlayed: number,
  path = "gamesPlayed"
): ValidationResult {
  if (gamesPlayed < MIN_GAMES_FOR_AWARD) {
    return failure([
      item(
        path,
        `Player must have at least ${MIN_GAMES_FOR_AWARD} games to qualify for an award`,
        "too_small"
      ),
    ]);
  }
  return success();
}

/**
 * Check that a date range (start <= end) is valid.
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
  startPath = "startDate",
  endPath = "endDate"
): ValidationResult {
  const startResult = validateDateValue(startDate, startPath);
  if (!startResult.success) return startResult;
  const endResult = validateDateValue(endDate, endPath);
  if (!endResult.success) return endResult;

  if (endDate < startDate) {
    return failure([
      item(endPath, "End date must not be before start date", "invalid_date_range"),
    ]);
  }
  return success();
}

/**
 * Check that a batch of entries is non-empty and each entry has a valid player and score.
 */
export function validateBatchEntries(
  entries: Array<{ player: unknown; score: unknown }>
): ValidationResult {
  if (!Array.isArray(entries) || entries.length === 0) {
    return failure([item("entries", "At least one entry is required", "too_small")]);
  }

  const allErrors: ValidationErrorItem[] = [];
  entries.forEach((entry, i) => {
    const prefix = `entries[${i}]`;
    allErrors.push(
      ...validatePlayerName(entry.player, `${prefix}.player`).errors
    );
    allErrors.push(...validateScore(entry.score, `${prefix}.score`).errors);
  });

  return allErrors.length === 0 ? success() : failure(allErrors);
}

// ========================================================================
// Utility: format validation results for UI display
// ========================================================================

/**
 * Format a ValidationResult into a single human-readable message,
 * or `null` if the result is valid.
 */
export function formatValidationMessage(result: ValidationResult): string | null {
  if (result.success) return null;
  return result.errors.map((e) => e.message).join("; ");
}

/**
 * Group errors by path prefix (e.g. group `entries[0].player` under `entries`).
 */
export function groupErrorsByPath(
  errors: ValidationErrorItem[]
): Record<string, ValidationErrorItem[]> {
  const groups: Record<string, ValidationErrorItem[]> = {};
  for (const err of errors) {
    const topPath = err.path.split(".")[0] ?? "(root)";
    if (!groups[topPath]) groups[topPath] = [];
    groups[topPath].push(err);
  }
  return groups;
}

/**
 * Build a field-level errors map (path -> message[]) suitable for form state.
 */
export function toFieldErrors(
  result: ValidationResult
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const err of result.errors) {
    if (!map[err.path]) map[err.path] = [];
    map[err.path].push(err.message);
  }
  return map;
}
