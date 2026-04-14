// Supabase 客户端 CRUD 操作 (用于客户端直接访问)
import { supabase } from "./client";

// ==================== 类型定义 ====================

// 比赛记录类型
interface PokerRecordRow {
  id: number;
  date: string;
  player: string;
  score: number;
  win: number;
  created_at: string;
}

// 赛季类型
interface SeasonRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
}

// 清分记录类型
interface ClearRecordRow {
  id: string;
  date: string;
  player: string;
  amount: number;
  season_id: string;
  clear_type: string;
  created_at: string;
}

// AI 缓存类型
interface AICacheRow {
  id: string;
  label: string;
  prompt: string;
  result: string;
  time: string;
  created_at: string;
}

// ==================== 比赛记录 CRUD ====================

export async function getAllRecordsFromSupabase(): Promise<PokerRecordRow[]> {
  const { data, error } = await supabase
    .from("poker_records")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getRecordsByDateRangeFromSupabase(startDate: string, endDate: string): Promise<PokerRecordRow[]> {
  const { data, error } = await supabase
    .from("poker_records")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertRecordToSupabase(record: {
  date: string;
  player: string;
  score: number;
  win: number;
}) {
  const { data, error } = await supabase.from("poker_records").insert(record as never).select().single();
  if (error) throw error;
  return data;
}

export async function insertRecordsToSupabase(records: { date: string; player: string; score: number; win: number }[]) {
  const { data, error } = await supabase.from("poker_records").insert(records as never).select();
  if (error) throw error;
  return data;
}

export async function deleteRecordFromSupabase(id: number) {
  const { error } = await supabase.from("poker_records").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteRecordsByDateFromSupabase(date: string) {
  const { error } = await supabase.from("poker_records").delete().eq("date", date);
  if (error) throw error;
}

// ==================== 赛季 CRUD ====================

export async function getAllSeasonsFromSupabase(): Promise<SeasonRow[]> {
  const { data, error } = await supabase.from("seasons").select("*").order("start_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getActiveSeasonsFromSupabase(): Promise<SeasonRow[]> {
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("active", true)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSeasonByIdFromSupabase(id: string): Promise<SeasonRow | null> {
  const { data, error } = await supabase.from("seasons").select("*").eq("id", id).limit(1).single();
  if (error) return null;
  return data;
}

export async function insertSeasonToSupabase(season: {
  name: string;
  start_date: string;
  end_date?: string;
  active?: boolean;
}) {
  const { data, error } = await supabase.from("seasons").insert(season as never).select().single();
  if (error) throw error;
  return data;
}

export async function updateSeasonFromSupabase(id: string, updates: { name?: string; end_date?: string; active?: boolean }) {
  const { data, error } = await supabase.from("seasons").update(updates as never).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function endSeasonFromSupabase(id: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("seasons")
    .update({ active: false, end_date: today } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== 清分记录 CRUD ====================

export async function getAllClearsFromSupabase(): Promise<ClearRecordRow[]> {
  const { data, error } = await supabase.from("clear_records").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getClearsBySeasonFromSupabase(seasonId: string): Promise<ClearRecordRow[]> {
  const { data, error } = await supabase
    .from("clear_records")
    .select("*")
    .eq("season_id", seasonId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getClearsByPlayerFromSupabase(player: string): Promise<ClearRecordRow[]> {
  const { data, error } = await supabase
    .from("clear_records")
    .select("*")
    .eq("player", player)
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertClearRecordToSupabase(record: {
  date: string;
  player: string;
  amount: number;
  season_id: string;
  clear_type: string;
}) {
  const { data, error } = await supabase.from("clear_records").insert(record as never).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClearRecordFromSupabase(id: string) {
  const { error } = await supabase.from("clear_records").delete().eq("id", id);
  if (error) throw error;
}

// ==================== AI 缓存 CRUD ====================

export async function getAllAICacheFromSupabase(): Promise<AICacheRow[]> {
  const { data, error } = await supabase.from("ai_cache").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAICacheByLabelFromSupabase(label: string): Promise<AICacheRow[]> {
  const { data, error } = await supabase
    .from("ai_cache")
    .select("*")
    .eq("label", label)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertAICacheToSupabase(cache: {
  label: string;
  prompt: string;
  result: string;
  time: string;
}) {
  const { data, error } = await supabase.from("ai_cache").insert(cache as never).select().single();
  if (error) throw error;
  return data;
}

export async function updateAICacheFromSupabase(id: string, result: string) {
  const { data, error } = await supabase
    .from("ai_cache")
    .update({ result, time: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAICacheFromSupabase(id: string) {
  const { error } = await supabase.from("ai_cache").delete().eq("id", id);
  if (error) throw error;
}
