import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TEXT_POSITIVE, TEXT_NEGATIVE, TEXT_NEUTRAL, LOCALE, MS_PER_DAY } from '@/lib/constants';

// ==================== Tailwind ====================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== Score / Number Formatting ====================

/**
 * Format a score with explicit +/- prefix and locale separators.
 *
 *   formatScore(1234)  → "+1,234"
 *   formatScore(-567)  → "-567"
 *   formatScore(0)     → "0"
 */
export function formatScore(score: number): string {
  if (score === 0) return '0';
  return score > 0 ? `+${score.toLocaleString()}` : score.toLocaleString();
}

/**
 * Format a decimal ratio as a percentage string.
 *
 *   formatPercent(0.451)   → "45.1%"
 *   formatPercent(0.5, 0)  → "50%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Safely parse an integer, returning `fallback` on failure.
 */
export function safeParseInt(value: string, fallback: number = 0): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Clamp a number between `min` and `max` (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ==================== Date / Time Formatting ====================

/**
 * Safely parse a date string, returning `null` on failure.
 * Shared internals for all date-formatting functions.
 */
function parseDateSafe(dateStr: string): Date | null {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Format an ISO date string into a short locale-aware display.
 * Falls back to the raw string if parsing fails.
 *
 *   formatShortDate("2025-10-26") → "10月26日"
 */
export function formatShortDate(dateStr: string): string {
  const d = parseDateSafe(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });
}

/**
 * Format an ISO date string into a full display with year.
 *
 *   formatFullDate("2025-10-26") → "2025年10月26日"
 */
export function formatFullDate(dateStr: string): string {
  const d = parseDateSafe(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO date string to a locale-aware time string.
 *
 *   formatTime("2026-06-25T14:30:00") → "14:30:00"
 */
export function formatTime(dateStr: string): string {
  const d = parseDateSafe(dateStr);
  if (!d) return dateStr;
  return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Format an ISO date string to a full date + time string.
 *
 *   formatDateTime("2026-06-25T14:30:00") → "2026年6月25日 14:30:00"
 */
export function formatDateTime(dateStr: string): string {
  const d = parseDateSafe(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ==================== Color Helpers ====================

/**
 * Return a Tailwind text-color class based on score sign.
 *
 *   getScoreColor(10)  → "text-emerald-500"
 *   getScoreColor(-5)  → "text-red-500"
 *   getScoreColor(0)   → "text-muted-foreground"
 */
export function getScoreColor(score: number): string {
  if (score > 0) return TEXT_POSITIVE;
  if (score < 0) return TEXT_NEGATIVE;
  return TEXT_NEUTRAL;
}

// ==================== Collection Helpers ====================

/**
 * Group an array by a string key derived from each item.
 *
 *   groupBy(records, r => r.date)
 *   // → { "2025-10-26": [r1, r2], "2025-11-01": [r3] }
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string,
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

/**
 * Sum an array of items by applying a numeric mapper.
 *
 *   sumBy(records, r => r.score)
 */
export function sumBy<T>(items: T[], fn: (item: T) => number): number {
  let total = 0;
  for (const item of items) {
    total += fn(item);
  }
  return total;
}

/**
 * Return a new array sorted by a numeric key.
 *
 *   sortByKey(players, p => p.total)           // descending (default)
 *   sortByKey(players, p => p.total, 'asc')
 */
export function sortByKey<T>(
  items: T[],
  keyFn: (item: T) => number,
  order: 'asc' | 'desc' = 'desc',
): T[] {
  return [...items].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    return order === 'asc' ? ka - kb : kb - ka;
  });
}

// ==================== Object Helpers ====================

/**
 * Pick specific keys from an object.
 *
 *   pick(player, ['name', 'total'])
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

/**
 * Omit specific keys from an object.
 *
 *   omit(player, ['scores'])
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj } as Omit<T, K>;
  for (const key of keys) {
    delete (result as Record<string, unknown>)[key as string];
  }
  return result;
}

// ==================== Array Helpers ====================

/**
 * Return a new array with duplicate values removed (by SameValueZero comparison).
 *
 *   uniq([1, 2, 2, 3])  → [1, 2, 3]
 */
export function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/**
 * Return a new array with duplicates removed based on a string key.
 * The first occurrence of each key is kept.
 *
 *   uniqBy(records, r => r.date)
 */
export function uniqBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * Generate an array of numbers in `[start, end)`, stepping by `step`.
 *
 *   range(0, 5)   → [0, 1, 2, 3, 4]
 *   range(1, 10, 3) → [1, 4, 7]
 */
export function range(start: number, end: number, step: number = 1): number[] {
  if (step <= 0) return [];
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Fisher-Yates shuffle — returns a new shuffled array.
 *
 *   shuffle([1, 2, 3, 4]) → [3, 1, 4, 2] (random)
 */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ==================== String Helpers ====================

/**
 * Format an ISO date string as a relative description ("今天", "3天前", etc.).
 * Falls back to formatShortDate for dates older than 7 days.
 *
 *   formatDateRelative("2026-06-25") → "今天"
 *   formatDateRelative("2026-06-22") → "3天前"
 */
export function formatDateRelative(dateStr: string): string {
  const d = parseDateSafe(dateStr);
  if (!d) return dateStr;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / MS_PER_DAY);
  if (days < 0) return formatShortDate(dateStr);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return formatShortDate(dateStr);
}

/**
 * Capitalize the first letter of a string.
 *
 *   capitalize("hello") → "Hello"
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate a string to a maximum length, appending an ellipsis if truncated.
 *
 *   truncate("Hello World", 8) → "Hello..."
 *   truncate("Hi", 8)         → "Hi"
 */
export function truncate(str: string, maxLength: number, ellipsis: string = "..."): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, Math.max(0, maxLength - ellipsis.length)) + ellipsis;
}

/**
 * Simple English pluralization by adding "s" or "es".
 * For non-English text or irregular plurals, pass the plural form explicitly.
 *
 *   pluralize(1, "record") → "1 record"
 *   pluralize(3, "record") → "3 records"
 *   pluralize(2, "box", "boxes") → "2 boxes"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural ?? singular + "s"}`;
}

// ==================== Validation ====================

/**
 * Check whether a string is a valid ISO date (or other Date-parseable value).
 *
 *   isValidDate("2026-06-25") → true
 *   isValidDate("not a date") → false
 */
export function isValidDate(dateStr: string): boolean {
  return parseDateSafe(dateStr) !== null;
}

/**
 * Check whether an array, object, or string is empty.
 * Returns `false` for `null` / `undefined`.
 *
 *   isEmpty([])        → true
 *   isEmpty({})        → true
 *   isEmpty("")        → true
 *   isEmpty([1])       → false
 *   isEmpty(null)      → false
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.length === 0;
  // Only check plain objects (not Date, Map, Set, etc.)
  if (isPlainObject(value)) return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

// ==================== Performance Utilities ====================

/**
 * Create a debounced version of a function.
 * The debounced function delays invoking `fn` until `delay` ms have elapsed
 * since the last invocation.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Create a throttled version of a function.
 * The throttled function invokes `fn` at most once every `interval` ms.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Memoize a pure function's return value by its first argument.
 * Useful for expensive computations where the input set is small and stable.
 *
 * Accepts functions with a first argument of type `string | number | symbol`
 * (values that can serve as Map keys with value equality).
 *
 * Caches up to `maxSize` entries (default 100) to prevent unbounded memory growth.
 *
 *   const expensiveFn = memoizeByFirstArg((id: string) => compute(id));
 *   expensiveFn("abc");  // computed
 *   expensiveFn("abc");  // cache hit
 */
export function memoizeByFirstArg<TArg extends string | number | symbol, TReturn>(
  fn: (arg: TArg) => TReturn,
  maxSize: number = 100,
): (arg: TArg) => TReturn {
  const cache = new Map<TArg, TReturn>();
  return (arg: TArg): TReturn => {
    if (cache.has(arg)) return cache.get(arg) as TReturn;
    const result = fn(arg);
    if (cache.size < maxSize) {
      cache.set(arg, result);
    }
    return result;
  };
}

/**
 * Return a Promise that resolves after `ms` milliseconds.
 *
 *   await sleep(300)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * A no-op function. Useful as a default callback or placeholder.
 */
export function noop(): void {
  // intentional no-op
}

// ==================== Storage Helpers ====================

/**
 * Safely read and JSON-parse a value from localStorage.
 *
 * Returns `fallback` (default `null`) on SSR, missing key, or parse error —
 * never throws.
 *
 *   safeGetItem<PlayerSettlement[]>(STORAGE_KEY)        → T | null
 *   safeGetItem<PlayerSettlement[]>(STORAGE_KEY, [])    → T (with fallback)
 */
export function safeGetItem<T = unknown>(key: string, fallback: T | null = null): T | null {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely JSON-serialize and write a value to localStorage.
 *
 * Silently ignores SSR and storage errors (quota exceeded, etc.).
 * Logs a warning on failure for debuggability.
 *
 *   safeSetItem(STORAGE_KEY, records)
 */
export function safeSetItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write localStorage key "${key}"`, e);
  }
}

// ==================== Type Guards ====================

/**
 * Check whether a value is a plain object (not null, not array, not Date, etc.).
 *
 *   isPlainObject({})        → true
 *   isPlainObject([])        → false
 *   isPlainObject(null)      → false
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Check whether a value is `null` or `undefined`.
 *
 *   isNil(null)     → true
 *   isNil(undefined) → true
 *   isNil(0)        → false
 */
export function isNil(value: unknown): value is null | undefined {
  return value == null;
}

// ==================== Object Merging ====================

/**
 * Deep merge two objects.  Arrays are replaced, not concatenated.
 * Plain objects are merged recursively; all other values use `b` over `a`.
 *
 *   deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 }, e: 4 })
 *   // → { a: 1, b: { c: 2, d: 3 }, e: 4 }
 */
export function deepMerge<T extends Record<string, unknown>>(a: T, b: Partial<T>, depth: number = 0): T {
  if (depth > 32) return { ...a, ...b } as T; // Guard against circular references
  const result = { ...a };
  for (const key of Object.keys(b) as (keyof T)[]) {
    const valA = a[key];
    const valB = b[key];
    if (isPlainObject(valA) && isPlainObject(valB)) {
      result[key] = deepMerge(valA as Record<string, unknown>, valB as Record<string, unknown>, depth + 1) as T[typeof key];
    } else if (valB !== undefined) {
      result[key] = valB;
    }
  }
  return result;
}

// ==================== Array / Collection Helpers ====================

/**
 * Flatten an array of arrays by one level.
 *
 *   flatten([[1, 2], [3], [4, 5]]) → [1, 2, 3, 4, 5]
 */
export function flatten<T>(items: T[][]): T[] {
  const result: T[] = [];
  for (const group of items) {
    for (const item of group) {
      result.push(item);
    }
  }
  return result;
}

/**
 * Zip multiple arrays together, stopping at the shortest length.
 *
 *   zip(["a", "b"], [1, 2]) → [["a", 1], ["b", 2]]
 */
export function zip<T, U>(a: T[], b: U[]): [T, U][];
export function zip<T, U, V>(a: T[], b: U[], c: V[]): [T, U, V][];
export function zip<T>(...arrays: T[][]): T[][] {
  const minLen = Math.min(...arrays.map((arr) => arr.length));
  const result: T[][] = [];
  for (let i = 0; i < minLen; i++) {
    const group: T[] = [];
    for (const arr of arrays) {
      group.push(arr[i]);
    }
    result.push(group);
  }
  return result;
}

/**
 * Split an array into chunks of the given size.
 *
 *   chunk([1, 2, 3, 4, 5], 2) → [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

/**
 * Create a Map keyed by the result of `keyFn` for fast lookups.
 *
 *   indexBy(records, r => r.id)  → Map<string, PokerRecord>
 */
export function indexBy<T, K extends string | number | symbol>(
  items: T[],
  keyFn: (item: T) => K,
): Map<K, T> {
  const map = new Map<K, T>();
  for (const item of items) {
    map.set(keyFn(item), item);
  }
  return map;
}

/**
 * Partition an array into two groups: those passing `predicate` and those failing it.
 *
 *   partition([1, 2, 3, 4], n => n % 2 === 0) → [[2, 4], [1, 3]]
 */
export function partition<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of items) {
    (predicate(item) ? pass : fail).push(item);
  }
  return [pass, fail];
}

// ==================== Async Helpers ====================

/**
 * Retry an async function with exponential backoff.
 *
 *   const data = await retry(() => fetch("/api/data").then(r => r.json()))
 *   const data = await retry(() => apiCall(), { maxRetries: 3, baseDelay: 500 })
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  throw lastErr;
}

/**
 * Create a function that invokes `fn` at most once.
 * Subsequent calls return the result of the first invocation.
 *
 *   const initialize = once(() => createConnection())
 *   initialize()  // created
 *   initialize()  // returns same result
 */
export function once<T>(fn: () => T): () => T {
  let called = false;
  let result: T;
  return () => {
    if (!called) {
      called = true;
      result = fn();
    }
    return result;
  };
}

/**
 * Time a Promise and return both the result and the elapsed time in ms.
 *
 *   const { result, elapsed } = await timed(fetch("/api/data"))
 */
export async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; elapsed: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, elapsed: performance.now() - start };
}

// ==================== Function Composition ====================

/**
 * Left-to-right function composition.
 *
 *   const double = (n: number) => n * 2
 *   const toString = (n: number) => String(n)
 *   pipe(double, toString)(5) → "10"
 */
export function pipe<A, B>(f: (a: A) => B): (a: A) => B;
export function pipe<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C;
export function pipe<A, B, C, D>(f: (a: A) => B, g: (b: B) => C, h: (c: C) => D): (a: A) => D;
export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T;
export function pipe(...fns: Array<(arg: unknown) => unknown>): (arg: unknown) => unknown {
  return (arg: unknown) => fns.reduce((acc, fn) => fn(acc), arg);
}

/**
 * Right-to-left function composition.
 *
 *   const double = (n: number) => n * 2
 *   const toString = (n: number) => String(n)
 *   compose(toString, double)(5) → "10"
 */
export function compose<A, B>(f: (a: A) => B): (a: A) => B;
export function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C;
export function compose<A, B, C, D>(f: (c: C) => D, g: (b: B) => C, h: (a: A) => B): (a: A) => D;
export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T;
export function compose(...fns: Array<(arg: unknown) => unknown>): (arg: unknown) => unknown {
  return (arg: unknown) => fns.reduceRight((acc, fn) => fn(acc), arg);
}
