// Drizzle ORM Database Connection (Server-side)
// 注：这个文件用于服务端数据库操作，目前主要使用 Supabase 客户端
// 如需使用 Drizzle ORM，请安装: pnpm add postgres && pnpm add -D drizzle-orm

// 暂时注释掉 drizzle 相关代码，因为 Supabase 客户端已足够
// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import * as schema from "./shared/schema";

// export const db = drizzle(queryClient, { schema });

// 导出 schema 以便在其他地方使用
export * from "./shared/schema";
