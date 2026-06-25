# UX/交互审计 · 第 5 轮

**日期**: 2026-06-24
**范围**: 微信小程序深入、Excel 集成、Coach DB Schema、硬编码路径、Seed API、样式体系
**方法**: 代码静态分析 + 跨项目对比 + 安全性审查

---

## 一、不便于操作（3 项）

### 🔴 [OP-19] 多个 API 路由硬编码开发者本机路径 `D:\\02工作\\texa\\数据`
- **文件**: `settlements-excel/route.ts:6`、`import-status/route.ts:11`、`excel-import-service.ts`
- **问题**: `const DEFAULT_WATCH_DIR = "D:\\02工作\\texa\\数据"` 硬编码了开发者本机的绝对路径。换一台电脑部署，或者换一个用户目录，Excel 导入/清分读取功能**全部失效**。更严重的是，`import-status/route.ts` 的 POST 端点用 `importExcelDirectory(dir)` 扫描目录并导入全部 Excel——如果另一个用户恰好也有这个路径，可能导入错误数据。
- **修复**: 使用相对路径（相对于项目根目录），或从环境变量读取，并提供清晰的配置说明。

### 🔴 [OP-20] `/api/seed` POST 无任何认证保护
- **文件**: `seed/route.ts:17-25`
- **问题**: `POST /api/seed` 直接调用 `seedDatabase()` 并强制重新播种，**无任何认证、密码或 token 验证**。任何知道这个 URL 的人都可以通过 POST 请求**清空并重置整个数据库**。
- **修复**: 添加环境变量 token 验证，或完全移除 POST 端点（生产环境不需要）。

### 🟡 [OP-21] `excel-import-service.ts` 使用 Node.js `fs`/`crypto` 模块，限制部署平台
- **文件**: `excel-import-service.ts:1-3`
- **问题**: `import * as fs from "fs"` + `import * as crypto from "crypto"` — 使用 Node.js 原生模块。这在 serverless 平台（Vercel Edge、Cloudflare Workers）**无法运行**。Next.js 16 支持 Edge Runtime，但这个文件强制绑定 Node.js runtime。
- **修复**: 在 route handler 中声明 `export const runtime = "nodejs"`，或改用 Web API（如 `crypto.subtle`）。

---

## 二、交互逻辑弱（4 项）

### 🔴 [IX-25] 微信小程序使用 `callFunction` 云函数模式，与 Web 版数据库直连完全不兼容
- **文件**: `poker-weapp/src/services/sessionService.ts:9-13`
- **问题**: 小程序的所有数据操作通过 `callFunction('session', { action: 'createSession', data })` 调用云函数。这意味着小程序需要一个**独立的云函数后端**（可能是微信云开发）。但 Web 版直接通过 REST API 操作本地 SQLite。**两个平台使用完全不同的后端架构**，数据无法互通。如果用户在手机上用小记录了数据，Web 端看不到。
- **修复**: 至少为小程序提供一个切换到 REST API 的选项（通过环境变量），指向同一个 Web 后端。

### 🟡 [IX-26] `settlements-excel/route.ts` 使用 `require("fs")` 内联 CommonJS
- **文件**: `settlements-excel/route.ts:11`
- **问题**: 在 ES Module 的 Next.js 路由文件中使用 `require("fs")`。这在某些打包配置下可能失败。而且 `require` 是**同步加载**，会阻塞事件循环——虽然在此场景下影响不大，但代码风格与全项目 ESM 不一致。
- **修复**: 改为顶层 `import fs from "node:fs"`。

### 🟡 [IX-27] `ScrollIndicator` 组件实现良好但仅在赛季标签栏使用一次
- **文件**: `ui/scroll-indicator.tsx` → `page.tsx`（间接使用）
- **问题**: `ScrollIndicator` 是一个很好实现的水平滚动指示器组件（mask-image 渐隐 + 滑动提示），但**全项目仅使用一次**（在赛季标签栏）。手牌历史列表、排行页的横向表格等同样需要水平滚动的场景都未使用。
- **修复**: 在其他水平滚动场景中复用此组件。

### 🟢 [IX-28] 微信小程序样式用 SCSS Modules，Web 用 Tailwind CSS — 两套完全不同的样式体系
- **文件**: `poker-weapp/src/**/*.module.scss` vs `poker-tracker/src/**/*.tsx` (Tailwind)
- **问题**: 小程序使用 `index.module.scss` 的 CSS Modules 模式（Taro 框架限制），Web 版使用 Tailwind CSS utility classes。这意味着**样式完全无法复用**。同一个 UI 组件（如"玩家列表"）在小程序和 Web 端需要用完全不同的方式实现。
- **修复**: 这不是 bug 而是框架限制。但可以通过抽取共享的设计 token（颜色、间距、字号）为 JSON 来减少视觉不一致。

---

## 三、功能延申不合理（4 项）

### 🔴 [FE-19] Coach 数据库 Schema 完整定义了 3 张表，但 coach-store 从未写入 DB
- **文件**: `coach-schema.ts` (77行, 3 表, 外键+级联删除+索引) vs `coach-store.ts` (481行, 全部 mock)
- **问题**: Coach 模块在数据库层有完整的表结构：
  - `coach_sessions` (10 字段, 2 索引)
  - `coach_decisions` (19 字段, 外键引用, 级联删除, 2 复合索引)
  - `coach_feedback` (7 字段, 外键, 1 索引)
  
  但 `coach-store.ts` **完全不使用这些表**——所有数据在 Zustand persist 中（localStorage）。`crud.ts` 中的 `insertCoachSession`、`insertCoachDecision`、`insertCoachFeedback` 等 CRUD 函数**也从未被任何组件调用**。
  
  这意味着：① 用户训练数据不会持久化到数据库（页面刷新后依赖 localStorage）；② 数据库中存在 3 张永远空着的表，浪费存储和迁移时间。
- **修复**: 决定 Coach 模块的定位——如果是轻量功能，删除 DB schema 并明确标注 localStorage-only；如果是完整功能，让 coach-store 调用 CRUD 写入 DB。

### 🟡 [FE-20] 微信小程序调用 `callFunction` 的后端是云函数，但 Web 版调用的是 Next.js API 路由 — 两套后端
- **文件**: `poker-weapp/src/services/*.ts` vs `poker-tracker/src/app/api/**/route.ts`
- **问题**: 两个项目不仅前端代码独立，**后端也完全不同**：
  - 小程序 → 微信云函数 (`callFunction('session', ...)`) 
  - Web → Next.js API Routes (`fetch('/api/sessions', ...)`)
  
  这意味着任何业务逻辑变更需要分别在两套后端实现。这也是为何小程序清分雷达是"开发中"——云函数后端可能根本未实现清分逻辑。
- **修复**: 统一后端为 Next.js API，小程序通过 HTTP(S) 调用同一套 API。

### 🟡 [FE-21] `excel-import-service.ts` 手动用 `sql` 模板创建 `import_log` 表，而 schema.ts 已有定义
- **文件**: `excel-import-service.ts:41-50`
- **问题**: `ensureImportLogTable()` 使用 `db.run(sql\`CREATE TABLE IF NOT EXISTS import_log (...)\`)` 手动建表。但在 `schema.ts` 中已经有 Drizzle 的 `importLog` 表定义。这意味着：① 表结构可能不一致（Drizzle schema 有 `createdAt` 字段但手动 SQL 用 `imported_at`）；② Drizzle 迁移工具无法管理这张表。
- **修复**: 删除手动 SQL，使用 Drizzle 的 migration 或 push 来管理所有表结构。

### 🟢 [FE-22] `data.ts` 的 `dashboard.tsx` 仍然从旧版 `data.ts` 导入类型
- **文件**: `dashboard.tsx:3-4`
- **问题**: `import type { ComputedStats, PlayerSettlement } from "@/lib/data"` — Dashboard 组件从 `data.ts`（遗留层）导入类型，而非从 `types.ts`。这延续了 [[UX-Audit-Round-4]] 中发现的**双轨类型问题**。`data.ts` 版本的 `PlayerSettlement` 只有 3 个字段，而 `types.ts` 版本有完整字段。
- **修复**: 改为 `import type { ComputedStats, PlayerSettlement } from "@/lib/types"`。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 2 | 1 | 0 | 3 |
| 交互逻辑弱 | 1 | 2 | 1 | 4 |
| 功能延申不合理 | 1 | 2 | 1 | 4 |
| **合计** | **4** | **5** | **2** | **11** |

### 本轮最严重发现

1. **[OP-19]** 硬编码 `D:\\02工作\\texa\\数据` 路径 — 部署到其他机器即失效
2. **[OP-20]** `/api/seed` POST 无认证 — 任何人可远程清空数据库
3. **[FE-19]** Coach DB 3 张表完整定义但从未写入 — 数据库层与业务层脱节
4. **[IX-25]** 小程序云函数 vs Web REST API — 两套后端无法互通
5. **[FE-21]** 手动 SQL 建表与 Drizzle schema 定义冲突

### 📈 累计进度

| 轮次 | 新问题 | 累计 | 🔴累计 |
|------|--------|------|--------|
| 第 1 轮 | 18 | 18 | 8 |
| 第 2 轮 | 15 | 33 | 14 |
| 第 3 轮 | 14 | 47 | 19 |
| 第 4 轮 | 13 | 60 | 25 |
| 第 5 轮 | 11 | **71** | **29** |

5 轮累计 **71 个问题**（29 个 🔴 高优先级）。
