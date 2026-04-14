// Supabase Browser Client - DEPRECATED
// 客户端不应直接访问 Supabase，必须通过 API Routes
// 保留此文件仅为向后兼容，新代码请使用 @/storage/database/supabase-client (服务端)
import { getSupabaseClient } from "@/storage/database/supabase-client";

// 导出服务端客户端供向后兼容
export const supabase = getSupabaseClient();
export { getSupabaseClient };
