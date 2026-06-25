# UX/交互审计 · 第 3 轮

**日期**: 2026-06-24
**范围**: API 路由、Service 层、CRUD 数据层、poker-weapp 小程序、类型安全、安全性
**方法**: 代码静态分析 + 数据流追踪 + 安全审查

---

## 一、不便于操作（4 项）

### 🔴 [OP-12] `hand-service.getHands()` 无参数时永不返回数据
- **文件**: `hand-service.ts:37`
- **问题**: `getHands()` 默认分支返回 `getHandsBySeason("")`。但 seasonId 由 `crypto.randomUUID()` 生成，永远不会是空字符串。这意味着**不带任何 filter 调用 `getHands()` 时永远返回空数组**。这个 bug 会导致手牌列表在某些场景下静默显示为空。
- **修复**: 默认分支改为调用 `getAllHands()` 并做类型转换。

### 🔴 [OP-13] `deleteSession` 级联删除不完整 — 关联的 handRecords 残留
- **文件**: `crud.ts:112-115`
- **问题**: `deleteSession()` 只级联删除了 `pokerRecords` 但**未删除关联的 `handRecords`**。删除一个场次后，与该场次关联的手牌记录变成孤儿数据（sessionId 指向已删除的 session）。
- **修复**: 在 `deleteSession` 中添加 `db.delete(handRecords).where(eq(handRecords.sessionId, id)).run()`。

### 🟡 [OP-14] 微信小程序清分雷达硬编码 "开发中" toast，入口浪费用户点击
- **文件**: `poker-weapp/src/pages/index/index.tsx:63`
- **问题**: `goClearRadar` 回调永远只显示 `Taro.showToast({ title: '清分雷达开发中（Sprint 2）', icon: 'none' })`。用户看到的是一个可交互的卡片，点击后却被告知"开发中"——反复点击反复失望。
- **修复**: 要么实现功能，要么在 UI 上标记为灰色不可点击，并标注"即将推出"。

### 🟡 [OP-15] AI 分析 30 秒超时对长文本分析不够
- **文件**: `ai-analysis/route.ts:28`
- **问题**: `setTimeout(() => controller.abort(), 30_000)` — 30 秒硬超时。当 prompt 包含大量 context（整个赛季数据）时，LLM 响应可能需要 60-120 秒。30 秒超时会导致**分析结果被截断**，用户只会看到错误信息。
- **修复**: 超时改为可配置（如 120 秒），或将 SSE 超时改为基于最后一个 chunk 的空闲超时。

---

## 二、交互逻辑弱（6 项）

### 🔴 [IX-14] AI 分析将用户 API Key 明文传给自己的后端服务器
- **文件**: `ai-analysis.tsx:84-86` → `ai-analysis/route.ts:115-117`
- **问题**: 前端将 `apiKey` 通过网络发给 `/api/ai-analysis`，后端用这个 key 直连 OpenAI 兼容 API。这意味着项目服务器**可以记录、泄露用户的第三方 API Key**。这是隐私红线。
- **修复**: 选项 A — 前端直接 fetch AI provider（绕过自己的后端）。选项 B — 后端使用自己的 API key，不要求用户提供。选项 C — 至少在前端明确告知并获取确认。

### 🔴 [IX-15] AI 分析的后端 SDK 兜底逻辑（coze SDK）可能在无配置时被触发
- **文件**: `ai-analysis/route.ts:124-141`
- **问题**: 当用户未配置 `apiKey` 和 `baseUrl` 时，走 coze SDK 通道。但 coze SDK 的 `Config()` 无参构造和 `LLMClient` 可能也需要特定的环境变量或配置。如果 coze 服务不可用，用户会看到模糊的错误信息。
- **修复**: 未配置时的通道应返回明确的提示"请先配置 AI 服务"，而非尝试 coze 兜底。

### 🟡 [IX-16] `getCoachSessions` 的 COUNT 查询使用 `.all().length` 而非 SQL COUNT
- **文件**: `crud.ts:371-376`
- **问题**: 
  ```ts
  const total = db.select({ count: coachSessions.id })
    .from(coachSessions).where(where).all().length
  ```
  这行代码 SELECT 了所有行的 `id` 字段到内存，然后取 `.length`。当教练会话积累到几百条时，每次分页查询都会**把全部数据拉到内存**再丢弃。
- **修复**: 使用 Drizzle 的 `count()` 聚合函数或 `sql` 模板。

### 🟡 [IX-17] 微信小程序和 Web 版有完全独立的 Store/Service 实现，零复用
- **文件**: `poker-weapp/src/stores/` vs `poker-tracker/src/stores/`
- **问题**: `useSeasonStore`、`useRecordStore` 在两个项目中是**完全不同的实现**——变量名相同但逻辑独立。这意味着 bug fix 需要在两个地方分别进行，且两边的功能特性可能不同步。例如 Web 版已有快速手牌录入，小程序版完全没有。
- **修复**: 抽取共享的核心逻辑（如积分计算、状态管理逻辑）为公共包，或至少通过文档保持 API 一致。

### 🟡 [IX-18] 微信小程序草稿恢复有竞态条件
- **文件**: `poker-weapp/src/pages/record/edit/index.tsx:60-93`
- **问题**: 草稿恢复在 `useEffect` 中异步执行（`checkDraft`），完成后设置 `draftReady=true`。但自动保存的 `useEffect`（line 82-93）依赖 `draftReady`。如果用户在草稿恢复弹窗出现前就开始输入数据，自动保存可能覆盖待恢复的草稿。
- **修复**: 在 `draftReady` 变为 true 之前禁用所有输入控件。

### 🟢 [IX-19] API 错误信息中 `error.message` 直接返回给客户端
- **文件**: 所有 `route.ts` 的 catch 块
- **问题**: `const message = error instanceof Error ? error.message : "Unknown error"` — 直接将内部错误信息返回给客户端。在 Drizzle 错误场景下，可能泄露数据库结构、表名、SQL 语句等敏感信息。
- **修复**: 生产环境返回通用错误信息，详细错误仅记录到服务端日志。

---

## 三、功能延申不合理（4 项）

### 🔴 [FE-10] AI 分析依赖外部 SDK `coze-coding-dev-sdk` 作为兜底通道
- **文件**: `ai-analysis/route.ts:2,126-128`
- **问题**: 项目依赖了一个名为 `coze-coding-dev-sdk` 的外部包（`LLMClient`、`Config`、`HeaderUtils`），来源可能是字节跳动的内部平台。如果这个 SDK 在用户环境中不可用（未安装或认证失败），AI 分析会**静默失败**。同时这个依赖没有在 `package.json` 中显式声明为 optional dependency。
- **修复**: 将 coze SDK 改为 optional dependency，在 import 时做 try-catch 并优雅降级。

### 🟡 [FE-11] pokerRecords 的 `win` 字段语义混乱：平局（score=0）计为"赢"
- **文件**: `session-service.ts:59,102-103`
- **问题**: `win: score >= 0 ? 1 : -1` — 当玩家 score=0（平局）时被计为 `win: 1`。"不输不赢"被归为"赢"在统计上是不正确的。`win` 字段在类型中定义为 `1 | -1`，不存在 `0`（平局）值。
- **修复**: 要么将 `win` 类型改为 `1 | 0 | -1`，要么在 score=0 时排除 win 统计。

### 🟡 [FE-12] poker-weapp 有独立的类型和工具函数，与 Web 版不兼容
- **文件**: `poker-weapp/src/types/` vs `poker-tracker/src/lib/types.ts`
- **问题**: 两个项目都有 `Player`、`Session`、`Season` 等类型定义，但字段名不兼容——小程序用 `_id`（MongoDB 风格），Web 版用 `id`（SQLite/UUID）。这导致**数据模型在两个平台间无法互操作**。如果未来要做数据同步，需要写大量转换逻辑。
- **修复**: 统一 ID 字段名为 `id`，小程序侧在数据序列化层做 `_id` ↔ `id` 映射。

### 🟢 [FE-13] `ai-analysis/route.ts` 30 秒超时使用的是 `setTimeout` abort，但 SSE 流中未处理 stream 关闭
- **文件**: `ai-analysis/route.ts:27-28`
- **问题**: 超时用 `controller.abort()` 触发，但 `ReadableStream` 的 `start()` 中用的是 `for await` 循环。abort 后 `fetch` 会抛出 `AbortError`，被 catch 捕获并发送 `error` 事件。但**SSE 连接可能已经部分发送数据**，客户端收到 `error` chunk 时 `result` 状态中已有不完整内容。
- **修复**: 在 client 端检测 `error` chunk 时附加标记说明"结果可能不完整"。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 2 | 2 | 0 | 4 |
| 交互逻辑弱 | 2 | 3 | 1 | 6 |
| 功能延申不合理 | 1 | 2 | 1 | 4 |
| **合计** | **5** | **7** | **2** | **14** |

### 本轮最严重发现

1. **[IX-14]** 用户 API Key 明文经过后端 — 隐私红线
2. **[OP-12]** `getHands()` 无参数返回空数组 — 静默数据丢失 bug
3. **[OP-13]** Session 删除不级联手牌 — 产生孤儿数据
4. **[IX-16]** Coach 分页 COUNT 用 `.all().length` — 性能隐患
5. **[IX-17]** Web/小程序双份 Store/Service — 维护噩梦

### 📈 累计进度

| 轮次 | 新问题 | 累计 | 🔴累计 | 🟡累计 |
|------|--------|------|--------|--------|
| 第 1 轮 | 18 | 18 | 8 | 6 |
| 第 2 轮 | 15 | 33 | 14 | 13 |
| 第 3 轮 | 14 | **47** | **19** | **20** |
