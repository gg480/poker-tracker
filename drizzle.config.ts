import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/storage/database/shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "https://integration.coze.cn",
  },
});
