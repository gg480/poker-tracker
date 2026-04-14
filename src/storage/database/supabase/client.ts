// Supabase Browser Client
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.COZE_INTEGRATION_BASE_URL || "https://integration.coze.cn";
const supabaseKey = process.env.COZE_LOOP_API_TOKEN || "";

// 创建 Supabase 客户端单例
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

// 导出 supabase 单例供其他模块使用
export const supabase = getSupabaseClient();
