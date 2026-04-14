// 服务端 Supabase CRUD 操作
// 此文件仅在 API Routes (服务端) 中使用
import { getSupabaseClient } from "@/storage/database/supabase-client";

// ==================== 比赛记录 ====================

export async function getAllRecords() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("poker_records")
    .select("date, player, score, win")
    .order("date", { ascending: false });
  if (error) throw new Error(`查询比赛记录失败: ${error.message}`);
  return data || [];
}

export async function getRecordsByDateRange(startDate: string, endDate: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("poker_records")
    .select("date, player, score, win")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });
  if (error) throw new Error(`按日期查询比赛记录失败: ${error.message}`);
  return data || [];
}

export async function insertRecords(records: { date: string; player: string; score: number; win: number }[]) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("poker_records").insert(records as never).select();
  if (error) throw new Error(`插入比赛记录失败: ${error.message}`);
  return data;
}

export async function deleteRecordsByDate(date: string) {
  const client = getSupabaseClient();
  const { error } = await client.from("poker_records").delete().eq("date", date);
  if (error) throw new Error(`删除比赛记录失败: ${error.message}`);
}

// ==================== 赛季 ====================

export async function getAllSeasons() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("seasons")
    .select("id, name, start_date, end_date, active")
    .order("start_date", { ascending: false });
  if (error) throw new Error(`查询赛季失败: ${error.message}`);
  return data || [];
}

export async function getActiveSeasons() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("seasons")
    .select("id, name, start_date, end_date, active")
    .eq("active", true)
    .order("start_date", { ascending: false });
  if (error) throw new Error(`查询活跃赛季失败: ${error.message}`);
  return data || [];
}

export async function insertSeason(season: { name: string; start_date: string; end_date?: string; active?: boolean }) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("seasons").insert(season as never).select().single();
  if (error) throw new Error(`插入赛季失败: ${error.message}`);
  return data;
}

export async function updateSeason(id: string, updates: { name?: string; end_date?: string; active?: boolean }) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("seasons").update(updates as never).eq("id", id).select().single();
  if (error) throw new Error(`更新赛季失败: ${error.message}`);
  return data;
}

export async function endSeasonById(id: string) {
  const client = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await client
    .from("seasons")
    .update({ active: false, end_date: today } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`结束赛季失败: ${error.message}`);
  return data;
}

// ==================== 清分记录 ====================

export async function getAllClears() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("clear_records")
    .select("id, date, player, amount, season_id, clear_type")
    .order("date", { ascending: false });
  if (error) throw new Error(`查询清分记录失败: ${error.message}`);
  return data || [];
}

export async function getClearsBySeason(seasonId: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("clear_records")
    .select("id, date, player, amount, season_id, clear_type")
    .eq("season_id", seasonId)
    .order("date", { ascending: false });
  if (error) throw new Error(`按赛季查询清分记录失败: ${error.message}`);
  return data || [];
}

export async function insertClearRecord(record: { date: string; player: string; amount: number; season_id: string; clear_type: string }) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("clear_records").insert(record as never).select().single();
  if (error) throw new Error(`插入清分记录失败: ${error.message}`);
  return data;
}

// ==================== AI 缓存 ====================

export async function getAllAICache() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("ai_cache")
    .select("id, label, prompt, result, time")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`查询AI缓存失败: ${error.message}`);
  return data || [];
}

export async function insertAICache(cache: { label: string; prompt: string; result: string; time: string }) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("ai_cache").insert(cache as never).select().single();
  if (error) throw new Error(`插入AI缓存失败: ${error.message}`);
  return data;
}

export async function updateAICache(id: string, result: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("ai_cache")
    .update({ result, time: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`更新AI缓存失败: ${error.message}`);
  return data;
}

export async function findAICacheByLabel(label: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("ai_cache")
    .select("id, label, prompt, result, time")
    .eq("label", label)
    .maybeSingle();
  if (error) throw new Error(`查询AI缓存by label失败: ${error.message}`);
  return data;
}

export async function trimAICache(keepCount: number = 3) {
  const client = getSupabaseClient();
  // Get all IDs ordered by created_at desc
  const { data, error } = await client
    .from("ai_cache")
    .select("id")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`查询AI缓存ID失败: ${error.message}`);
  if (!data || data.length <= keepCount) return 0;
  const idsToDelete = data.slice(keepCount).map((d: { id: string }) => d.id);
  const { error: delError } = await client
    .from("ai_cache")
    .delete()
    .in("id", idsToDelete);
  if (delError) throw new Error(`删除旧AI缓存失败: ${delError.message}`);
  return idsToDelete.length;
}
