# UX/交互审计 · 第 4 轮

**日期**: 2026-06-24
**范围**: poker-engine、gto-engine、stats 计算、clear-radar 服务、遗留 data 层、测试与构建
**方法**: 代码静态分析 + 类型系统审查 + 构建配置分析

---

## 一、不便于操作（3 项）

### 🔴 [OP-16] poker-tracker 项目零测试覆盖
- **文件**: 全局
- **问题**: `package.json` 配置了 `vitest run`、`test:watch`、`test:ui`、`test:coverage`，但项目源码中**没有任何 `.test.ts` 或 `.spec.ts` 文件**。所有测试基建（vitest 4.x、@vitest/ui）都是摆设。核心计算逻辑（`stats.ts`、`clear-radar-service.ts`、`session-service.ts`）一旦被改动，没有任何自动化验证。
- **修复**: 至少为 `stats.ts`（`computeStats`）、`clear-radar-service.ts`（`calcPlayerBalance`、`checkThreshold`）编写单元测试。

### 🔴 [OP-17] 构建脚本仅支持 bash，Windows 用户无法直接运行
- **文件**: `package.json:6-10`
- **问题**: `"build": "bash ./scripts/build.sh"`、`"dev": "bash ./scripts/dev.sh"` — 项目位于 `D:\02工作\texa`（Windows），但所有脚本强制使用 bash。在 cmd/PowerShell 中运行 `pnpm dev` 会失败。
- **修复**: 添加跨平台脚本（如 `cross-env` + Node 脚本），或提供 PowerShell 等效脚本。

### 🟡 [OP-18] `gto-engine.ts` 仅支持翻前分析，但 UI 暗示全街可用
- **文件**: `gto-engine.ts:159-283`
- **问题**: `getGTORecommendation()` 整个函数只处理翻前（preflop）场景。`facingAction` 参数的 open/raise/3bet 逻辑（line 177-247）**全部是翻前逻辑**。但当用户在 flop/turn/river 街头查看 GTO 建议时，hand-wizard 仍会调用同一个函数（通过 `engine?.street === "preflop"` 的条件渲染来限制显示）。其实 UI 已经在翻后隐藏了 GTO 面板，但函数签名和命名暗示全街支持，不熟悉代码的开发者可能误用。
- **修复**: 函数重命名为 `getPreflopGTORecommendation()`，或在文档注释中明确标注 "翻前专用"。

---

## 二、交互逻辑弱（5 项）

### 🔴 [IX-20] `lib/data.ts` 与 `lib/types.ts` 定义了重复的 `PokerRecord` / `Season` 类型 — 双轨类型系统
- **文件**: `data.ts:6-19` vs `types.ts:1-6`
- **问题**: `data.ts` 的 `PokerRecord` 只有 `{ date, player, score, win }` 四个字段，而 `types.ts` 的同名类型推断自 SQLite schema（含 `id, seasonId, sessionId, status, createdAt` 等完整字段）。`data.ts` 导出的 `SEED_RECORDS` 使用旧版 `PokerRecord`（无 id/seasonId/sessionId），而 API 层使用 `types.ts` 的版本。**同一个名字在不同文件中是完全不同的类型**。
- **修复**: `data.ts` 的旧版类型重命名为 `LegacyPokerRecord` 或从 `types.ts` 重新导出，消除歧义。

### 🔴 [IX-21] `stats.ts` 从 `data.ts` 导入类型，`stats-service.ts` 从 `types.ts` 导入类型 — 类型不兼容
- **文件**: `stats.ts:2` vs `stats-service.ts:1`
- **问题**: `stats.ts` 的 `computeStats(records: PokerRecord[])` 中的 `PokerRecord` 来自 `./data`（4 个字段），而 `stats-service.ts` 调用时传入的是 `@/lib/types` 版本（11+ 字段）。TypeScript 的结构兼容性让这能编译通过，但 **`stats.ts` 只使用 `date, player, score` 三个字段**，丢失了 `sessionId`/`seasonId` 等关键维度。这就是为什么 `computeStats` 无法按赛季聚合。
- **修复**: 统一 `stats.ts` 的类型导入指向 `@/lib/types`，并利用 `sessionId`/`seasonId` 实现按场次/赛季过滤的统计。

### 🟡 [IX-22] `clear-radar-service.getAlerts` 接受 `settlements` 参数但不使用它
- **文件**: `clear-radar-service.ts:53-54`
- **问题**: `getAlerts(playerBalances: PlayerBalance[], settlements: PlayerSettlement[], ...)` — `settlements` 参数在函数体内**从未被引用**（line 57-88）。调用方传入了这个参数，但函数直接忽略了它。如果未来有人添加使用这个参数的逻辑，会静默改变行为。
- **修复**: 移除无用参数，或实现原本设计的过滤逻辑。

### 🟡 [IX-23] `stats-service.ts` 有显式禁用的 dead parameter
- **文件**: `stats-service.ts:7-8`
- **问题**: `_settlements?: PlayerSettlement[]` 前缀 `_` 并加了 `eslint-disable` 注释。这个参数**从未被任何调用方传入**（搜索 profile-page、ranking-page 的调用），它只是为"未来扩展"预留的。但签名中有这个参数会让调用方困惑。
- **修复**: 要么实现其功能，要么彻底移除。

### 🟢 [IX-24] `stats.ts` 连胜计算按日期聚合，但一个日期可能有多场 session
- **文件**: `stats.ts:38-49`
- **问题**: `longestWinStreak` 按 `sortedDates`（日期）计算连胜。如果同一天有多个 session，一个 session 的积分被另一个抵消（`p.dateRecords.set(d, (p.dateRecords.get(d) || 0) + r.score)`），导致**一天内赢 3 场输 1 场可能被计为"连胜中断"**（如果合计为负）或"连胜继续"（如果合计为正）。实际上应该按场次计算。
- **修复**: 连胜应按 sessionId 而非日期聚合计算。

---

## 三、功能延申不合理（5 项）

### 🔴 [FE-14] `@aws-sdk/client-s3` 依赖但项目中无任何 S3 使用
- **文件**: `package.json:18-19`
- **问题**: 项目依赖了 `@aws-sdk/client-s3` 和 `@aws-sdk/lib-storage`，但**全项目搜索无任何 S3 相关 import 或使用**。这意味着每次 `pnpm install` 都会下载 AWS SDK（~5MB+），但完全用不到。可能是早期设计预留或复制模板时残留。
- **修复**: 移除未使用的 S3 依赖。

### 🔴 [FE-15] `package.json` 依赖了 28 个 `@radix-ui/*` 包，其中多个可能未使用
- **文件**: `package.json:21-46`
- **问题**: 项目使用 shadcn/ui（基于 Radix），但 Radix 包是按需安装的。检查源码导入后发现某些包根本未被引用（如 `@radix-ui/react-menubar`、`@radix-ui/react-navigation-menu`、`@radix-ui/react-context-menu`）。每个未使用的包增加安装时间和 `node_modules` 体积。
- **修复**: 使用 `depcheck` 工具扫描未使用的依赖并清理。

### 🟡 [FE-16] `data.ts` 的 localStorage 层是 Phase 0 重构的遗留物
- **文件**: `data.ts` (全文件 ~400+ 行)
- **问题**: `data.ts` 导出了 `loadRecords`、`saveRecords`、`loadSeasons`、`saveSeasons` 等 localStorage 函数。这些在 Phase 0 的 SQLite 迁移后**全部变成了 fallback 路径**。`page.tsx:71-74` 仅在 API 失败且 localStorage 有数据时才使用。但 `data.ts` 中的类型、种子数据、计算函数仍然被大量引用，形成了一个**从未被清理的半废弃层**。
- **修复**: 将仍被活跃使用的函数（`SEED_RECORDS`、`SEED_SEASONS`、`calcBalance` 等）提取到独立模块，废弃 localStorage 层并添加 `@deprecated` 标记。

### 🟡 [FE-17] `clear-radar-service.ts` 的 `REMINDER_INTERVAL_HOURS` 固定 48 小时不可配置
- **文件**: `constants.ts:3` + `clear-radar-service.ts:43-51`
- **问题**: 清分提醒间隔硬编码为 48 小时。不同用户群体的清分频率不同（有的每周打，有的每月打），48 小时对低频群体太激进（每次打开都提醒），对高频群体可能太慢。
- **修复**: 将间隔设为用户可配置项，存储在 `ui-store` 或 `localStorage`。

### 🟢 [FE-18] `data.ts` 的 `calcOverallBalance` 函数与 `clear-radar-service.ts` 的 `calcPlayerBalance` 功能重叠
- **文件**: `data.ts:53-58` vs `clear-radar-service.ts:13-24`
- **问题**: 两个模块中各有一个余额计算函数。`data.ts` 版本跨赛季汇总，`clear-radar-service.ts` 版本单赛季。但它们的核心公式相同（`totalScore - settleScore + seasonAdjust`），只是聚合维度不同。重复的公式意味着如果清分规则调整，需要修改两处。
- **修复**: 合并为同一模块的 `calcBalance` 并支持跨赛季/单赛季两种模式。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 2 | 1 | 0 | 3 |
| 交互逻辑弱 | 2 | 2 | 1 | 5 |
| 功能延申不合理 | 2 | 2 | 1 | 5 |
| **合计** | **6** | **5** | **2** | **13** |

### 本轮最严重发现

1. **[FE-14/FE-15]** 大量未使用依赖（AWS S3、多个 Radix 包）— 包体积膨胀
2. **[IX-20]** 双轨类型系统（`data.ts` vs `types.ts`）— 维护隐患
3. **[OP-16]** 零测试覆盖 — 核心逻辑无安全保障
4. **[IX-21]** `stats.ts` 和 `stats-service.ts` 从不同源导入类型 — 数据丢失
5. **[OP-17]** 构建脚本仅支持 bash，Windows 用户无法直接运行

### 📈 累计进度

| 轮次 | 新问题 | 累计 | 🔴累计 |
|------|--------|------|--------|
| 第 1 轮 | 18 | 18 | 8 |
| 第 2 轮 | 15 | 33 | 14 |
| 第 3 轮 | 14 | 47 | 19 |
| 第 4 轮 | 13 | **60** | **25** |

4 轮累计 **60 个问题**（25 个高优先级）。
