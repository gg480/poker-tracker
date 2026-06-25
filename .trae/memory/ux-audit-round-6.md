# UX/交互审计 · 第 6 轮

**日期**: 2026-06-24
**范围**: 赛季报告、导入状态、文件监听、Excel 解析、死代码、测试覆盖、共享服务、清分雷达
**方法**: 代码静态分析 + 依赖图追踪 + 死代码检测

---

## 一、不便于操作（4 项）

### 🔴 [OP-22] `import-status-client.tsx` 和 `season-report-client.tsx` 使用 `window.location.href` 做导航
- **文件**: `import-status-client.tsx:11`、`season-report-client.tsx:113`
- **问题**: `window.location.href = "/"` 触发**整页刷新**，而不是 Next.js 的客户端路由。这意味着：① 失去所有 Zustand store 状态；② 重新执行数据加载；③ 页面闪烁。与底部导航栏的 Tab 切换（毫秒级）体验相比，独立路由页面的"返回"操作体验极差。
- **修复**: 使用 `useRouter().push("/")` 或 `useRouter().back()`。

### 🔴 [OP-23] `record-entry.tsx` 和 `season-manager.tsx` 是死代码
- **文件**: `record-entry.tsx` (220+行)、`season-manager.tsx` (200+行)
- **问题**: 两个组件都**没有任何 import 引用**——`grep` 全项目无 `import.*record-entry` 或 `import.*season-manager` 匹配。它们被 `collaborative-entry.tsx` 和 `end-season-dialog.tsx` 替代后从未删除，在代码库中产生了混淆（新开发者可能误用旧版组件）。
- **修复**: 删除这两个文件及关联的 `entry-status.tsx`、`score-validator.tsx`（如果也无引用）。

### 🟡 [OP-24] `season-manager.tsx` 本地重复定义 `CLEAR_THRESHOLD = 8000`
- **文件**: `season-manager.tsx:20` vs `constants.ts:1`
- **问题**: `constants.ts` 已导出 `CLEAR_THRESHOLD = 8000`，但 `season-manager.tsx` 又本地定义了相同的常量（line 20）。如果项目调整清分阈值，这个地方不会被更新，导致不一致的行为。这也是模块化不佳的标志。
- **修复**: 从 `@/lib/constants` 导入 `CLEAR_THRESHOLD`（如果该组件未来重新启用）。

### 🟢 [OP-25] 唯一的测试文件 `data.test.ts` 使用硬编码的中文玩家名
- **文件**: `__tests__/data.test.ts:12,33`
- **问题**: 测试中使用 `'佳'`、`'茄'` 等特定玩家名。虽然这不影响测试功能性，但暴露了开发者私人数据，且如果未来支持国际化会失败。
- **修复**: 使用通用的测试名如 `'PlayerA'`、`'PlayerB'`。

---

## 二、交互逻辑弱（5 项）

### 🔴 [IX-29] 项目有**两套完全独立的清分雷达实现**
- **文件**: 
  - 方案 A：`clear-radar-service.ts` → 基于 DB 的 `PlayerSettlement`/`PokerRecord` 数据
  - 方案 B：`clear-radar-alerts.tsx` → 基于 Excel 文件的 `SettlementData` 类型（来自 `/api/settlements-excel`）
- **问题**: 两套实现使用**不同的数据源、不同的类型、不同的计算逻辑**：
  - `clear-radar-service.ts` 使用 `calcPlayerBalance()` 从 DB 计算
  - `clear-radar-alerts.tsx` 使用 `fetchSettlements()` 从 Excel 文件解析
  
  用户可能在首页的"清分雷达"卡片看到一组数据，在排行页的"清分榜"看到完全不同的数据。
- **修复**: 统一为单一数据源（DB），删除 Excel 解析的清分逻辑。

### 🔴 [IX-30] `file-watcher.ts` 使用全局可变状态 + `fs.watch`，在 serverless/多实例环境不可靠
- **文件**: `file-watcher.ts` (149行)
- **问题**: 
  - `let watcher: fs.FSWatcher | null = null` — 全局单例，多实例部署时每个实例独立监控
  - `fs.watch` 在某些平台有已知问题（macOS 下可能不触发 rename 事件）
  - `pendingFiles` 使用 `Set` 做内存去重，进程重启后丢失
  - 整个模块是**纯 Node.js 实现**，无法在 Edge Runtime 运行
- **修复**: 考虑使用轮询 + 文件 hash（更可靠），或迁移到数据库层面的变更检测。

### 🟡 [IX-31] `share-service.ts` 使用 `document.getElementById("share-card")` — 硬编码 DOM ID
- **文件**: `share-service.ts:14` + `share-card.tsx:22`
- **问题**: `generateShareImage("share-card")` 查找 `id="share-card"` 的 DOM 元素。如果页面上同时有多个分享卡片（或打开多个分享弹窗），**DOM ID 冲突**会导致截图捕获错误的卡片。
- **修复**: 改为传入 `React.RefObject` 或使用唯一 ID（如 `share-card-${Date.now()}`）。

### 🟡 [IX-32] `import-status-panel.tsx` 的 `loadStatus()` 缺少错误处理
- **文件**: `import-status-panel.tsx:267-269`
- **问题**: `useEffect(() => { loadStatus() }, [loadStatus])` — `loadStatus` 是 async 函数，但其返回的 Promise **未被 catch**。如果 API 调用失败，用户看不到错误提示（只有 store 中可能设置了 error 状态，但 UI 未订阅）。
- **修复**: 添加 `.catch()` 或使用 try/catch wrapper。

### 🟢 [IX-33] `clear-radar-alerts.tsx` 空 `Props` 接口
- **文件**: `clear-radar-alerts.tsx:8`
- **问题**: `interface ClearRadarAlertsProps {}` — 空接口，但组件使用时传了 `{}`（line 63: `({}: ClearRadarAlertsProps)`）。这是多余的样板代码。
- **修复**: 移除空 Props 接口，直接使用 `React.FC` 或无参函数。

---

## 三、功能延申不合理（4 项）

### 🔴 [FE-23] 14 个文件依赖 `@/lib/data`（遗留 localStorage 层）— 重构未完成
- **文件**: 14 处导入（见 Grep 结果）
- **问题**: Phase 0 已将数据存储从 localStorage 迁移到 SQLite（Drizzle ORM），但 **14 个核心文件**仍然从 `@/lib/data` 导入类型和工具函数：
  - `page.tsx` — 主入口
  - `dashboard.tsx` — 首页看板
  - `ai-analysis.tsx` — AI 分析
  - `collaborative-entry.tsx` — 录入组件
  - `season-report-client.tsx` — 赛季报告
  - `season-comparison.tsx` — 赛季对比
  - etc.
  
  `data.ts` 里的 `PokerRecord` 类型缺少 `id`、`seasonId`、`sessionId`、`status`、`createdAt` 等 SQLite 字段。这意味着**所有依赖此类型的组件在处理 API 返回数据时都需要 `as PokerRecord` 类型断言**，丢失了类型安全。
- **修复**: 将所有 `@/lib/data` 的类型导入迁移到 `@/lib/types`，工具函数（`getRecordsForSeason` 等）迁移到 `@/services/`。

### 🟡 [FE-24] Excel 解析器的列索引硬编码为特定"记录登记表"格式
- **文件**: `excel-parser.ts:21-24`
- **问题**: 
  ```ts
  const COL_DATE = 0   // A 列
  const COL_PLAYER = 2  // C 列
  const COL_SCORE = 3   // D 列
  const COL_WIN = 6     // G 列
  ```
  Excel 解析器硬编码了特定的列结构（"记录登记表"格式）。如果用户的 Excel 列顺序不同，或使用不同的模板，导入功能**静默失败或产生错误数据**。
- **修复**: 支持列头名称匹配（而非列索引），或提供可配置的列映射。

### 🟡 [FE-25] `file-watcher.ts` 使用 `fs.watch` 进行文件监控 — 不适合 Web 部署
- **文件**: `file-watcher.ts:97`
- **问题**: 文件监控是**桌面/本地服务器的概念**。在 Vercel/Netlify 等 serverless 平台上：① 没有持久文件系统；② 实例随时可能被销毁；③ 多个实例各自独立监控。整个文件监控功能在这些平台上**完全不可用**。
- **修复**: 将文件监控标记为 "仅本地开发环境" 功能，在 serverless 环境下禁用。

### 🟢 [FE-26] `excel-settlement-parser.ts` 引用但未见于组件目录 — 可能是另一个独立解析器
- **文件**: `clear-radar-alerts.tsx:4` 导入 `@/lib/excel-settlement-parser`
- **问题**: 除了 `excel-parser.ts`（用于积分记录），项目还有 `excel-settlement-parser.ts`（用于清分数据）。两个 Excel 解析器各自独立，使用不同的解析逻辑和类型定义。这意味着维护 Excel 兼容性时需要在两处修改。
- **修复**: 合并为统一的 Excel 解析层，按 Sheet 名称分发到不同处理器。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 2 | 1 | 1 | 4 |
| 交互逻辑弱 | 2 | 2 | 1 | 5 |
| 功能延申不合理 | 1 | 2 | 1 | 4 |
| **合计** | **5** | **5** | **3** | **13** |

### 本轮最严重发现

1. **[FE-23]** 14 个文件依赖遗留 `data.ts` — Phase 0 重构半途而废
2. **[IX-29]** 两套独立清分雷达实现（DB vs Excel）— 数据源冲突
3. **[IX-30]** 文件监控全局单例 + `fs.watch` — serverless 不可用
4. **[OP-22]** `window.location.href` 全页刷新导航 — 破坏 SPA 体验
5. **[OP-23]** `record-entry.tsx` + `season-manager.tsx` 死代码未清理

### 📈 累计进度

| 轮次 | 新问题 | 累计 | 🔴累计 |
|------|--------|------|--------|
| 第 1 轮 | 18 | 18 | 8 |
| 第 2 轮 | 15 | 33 | 14 |
| 第 3 轮 | 14 | 47 | 19 |
| 第 4 轮 | 13 | 60 | 25 |
| 第 5 轮 | 11 | 71 | 29 |
| 第 6 轮 | 13 | **84** | **34** |

### 🔥 更新后的系统模式

| 模式 | 累计 | 本轮新增 |
|------|:---:|:---:|
| 双轨类型/代码 | 8 | +2 (清分雷达 DB vs Excel, 14 文件 data.ts 依赖) |
| Mock/空壳功能 | 6 | +2 (死代码文件, 空 Props 接口) |
| 静默失败/无反馈 | 6 | +1 (import-status 缺少错误处理) |
| 硬编码 | 5 | +1 (Excel 列索引) |
| 未使用依赖/代码 | 6 | +1 (record-entry 死代码) |
