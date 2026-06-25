# UX/交互审计 · 第 9 轮

**日期**: 2026-06-24
**范围**: poker-engine 完整剖析、Coach 服务层、小程序子包全貌、TypeScript 配置
**方法**: 代码静态分析 + 模块依赖验证 + 路径存在性检查

---

## 一、不便于操作（2 项）

### 🔴 [OP-33] `training-settings.tsx` 盲注数据错误 — "5/10" 被映射为 (50/100)
- **文件**: `training-settings.tsx:12-17`
- **问题**:
  ```ts
  const BLIND_OPTIONS = [
    { label: "1/2", small: 1, big: 2 },
    { label: "2/5", small: 5, big: 10 },
    { label: "5/10", small: 50, big: 100 },   // ❌ 应为 small: 5, big: 10
    { label: "10/20", small: 100, big: 200 },
  ]
  ```
  "5/10" 盲注被映射为 `small: 50, big: 100`（应该是 `small: 5, big: 10`）。后续三个选项的值也都是 10 倍于 label，但只有 "1/2" 是正确的。这意味着用户选择 "5/10" 盲注时实际玩的是 "50/100" — 盲注翻了 10 倍。
- **修复**: 将所有 small/big 值除以 10，或者统一 label 格式（都放大 10 倍显示）。

### 🟢 [OP-34] 手牌引擎 `calcEquity` 默认 500 次蒙特卡洛采样 — 精度不足
- **文件**: `poker-engine.ts:504`
- **问题**: `calcEquity(heroCards, board, numOpponents, numSamples = 500)` — 500 次采样对 equity 计算的误差约为 ±2.2%（95% 置信区间）。对于需要精确 EV 计算的产品，这个精度不足。专业工具通常使用 5000-50000 次采样。
- **修复**: 将默认值提高到 2000，或在 UI 中提供精度/速度选择。

---

## 二、交互逻辑弱（3 项）

### 🔴 [IX-42] 微信小程序 ALL 5 个子包页面均为桩 — 0/5 功能可用
- **文件**: 
  - `subpackages/ranking/pages/trend/index.tsx` — "走势图开发中..."
  - `subpackages/season/pages/awards/index.tsx` — "奖项详情开发中..."
  - `subpackages/season/pages/clear/index.tsx` — "清分操作开发中..."
  - `subpackages/season/pages/report/index.tsx` — "赛季总结报告开发中..."
  - `subpackages/share/pages/index/index.tsx` — "分享图生成开发中..."
- **问题**: poker-weapp 共有 13 个页面，**10 个是静态桩**（5 个子包页 + 3 个主 Tab 页 + 2 个其他页）。只有 `index`（首页）、`record/edit`（录入）、`record/index`（列表）、`record/detail`（详情）4 个页面有功能。产品完成度约 30%。
- **修复**: 评估是否真的需要所有子包页面。如果不需要，至少隐藏入口而非显示"开发中"。

### 🟡 [IX-43] `coach-service.ts` 有完整的后端实现（409 行），但 `coach-store.ts` 完全不使用它
- **文件**: `coach-service.ts` (后端服务层) vs `coach-store.ts` (前端 store)
- **问题**: `coach-service.ts` 是一个**完整的**教练服务层，调用了 CRUD 层写入 DB，有 GTO 引擎、equity 引擎、opponent 引擎等模块化结构。但 `coach-store.ts` 完全绕过它，使用自己的 `generateRandomHoleCards()`、`getMockGTOAdvice()` 等 mock 逻辑。**API 路由调用 coach-service，UI 调用 coach-store，两者数据完全不互通**。
- **修复**: coach-store 应改为通过 API 路由调用 coach-service，而非内部 mock。

### 🟢 [IX-44] `excel-settlement-parser.ts` 列索引硬编码（0-16），无表头验证
- **文件**: `excel-settlement-parser.ts:44-63`
- **问题**: 直接从列索引 `row[0]` 到 `row[16]` 取值，跳过 `row[7]-row[8]`、`row[11]-row[12]`（用硬编码的跳列）。如果 Excel 模板有修改（增删列），解析结果会完全错位。不检查表头行内容，直接假设第 i 行就是数据。
- **修复**: 解析表头行并匹配列名，而非按索引取值。

---

## 三、功能延申不合理（5 项）

### 🔴 [FE-35] `coach-service.ts` 从 5 个不存在的模块导入 — 导致构建失败
- **文件**: `coach-service.ts:29-44`
- **问题**:
  ```ts
  import { ... } from "@/lib/coach/types"      // 不存在
  import { ... } from "@/lib/coach/gto-engine"   // 不存在
  import { ... } from "@/lib/coach/equity-engine" // 不存在
  import { ... } from "@/lib/coach/feedback-engine" // 不存在
  import { ... } from "@/lib/coach/opponent-engine" // 不存在
  import { ... } from "@/lib/coach/postflop-strategy" // 不存在
  ```
  `Glob` 搜索 `lib/coach/**/*` 返回 **零文件**。`tsconfig.json` 有 `strict: true`，但 `skipLibCheck: true` 和 `allowJs: true` 可能让 TypeScript 在某些情况下不报错。但如果这些模块真的不存在，`tsc --noEmit` 或 `pnpm build` 应该会失败。这意味着：
  - 要么项目**实际上无法编译**（这些模块曾经存在但被删除了）
  - 要么文件存在于 node_modules 或其他路径中
  
  无论如何，教练 API 路由**在生产环境中 100% 不可用**。
- **修复**: 优先检查项目能否编译。如果能，确认模块所在路径。如果不能，创建缺失的模块或删除 coach-service.ts 的引用。

### 🔴 [FE-36] 教练模块有三层架构但全部互不相通
- **问题全景**:
  ```
  第1层: coach-schema.ts   → 3 张 DB 表 (完整的 Drizzle schema)
  第2层: coach-service.ts  → 409 行业务逻辑 (import 5 个不存在的模块)
  第3层: coach-store.ts    → 481 行 mock (全部 Math.random())
  
  + coach API routes (6 个端点) → 调用 coach-service → 调用不存在模块
  + coach UI (14 个组件)        → 使用 coach-store → 全部随机假数据
  ```
  三层各自独立，没有一层是完整可用的。这是**架构碎片化**的极致表现。
- **修复**: 先确定教练模块的真实需求，然后统一为单一实现路径。

### 🟡 [FE-37] `poker-engine.ts` 是项目最高质量的模块（558 行完整引擎），但仅被 hand-wizard 使用
- **文件**: `poker-engine.ts` (558行) + 使用量: 1 个组件
- **问题**: 
  - `PokerEngine` 类：完整的德州扑克引擎，含下注轮次、合法动作计算、底池分配
  - `HandEvaluator` 类：基于 Cactus Kev 的手牌评估器，含 equity Monte Carlo 模拟、Outs 计算、Pot Odds
  - 序列化支持：`toJSON()` / `fromJSON()` / `clone()`
  
  这是**专业级的扑克引擎** — 但只有 `hand-wizard.tsx` 使用它。Coach 模块本应使用这个引擎，却用了 `coach-store.ts` 的 `Math.random()`。
- **修复**: Coach 模块接入 `poker-engine.ts` 的 `HandEvaluator` 和 `PokerEngine`。

### 🟡 [FE-38] `coach-service.ts` 中 `evaluateDecisionResult` 的规则过于简化
- **文件**: `coach-service.ts:224-232`
- **问题**: 结果判定仅基于 "userAction === gtoAdvice.action"：
  - GTO 推荐 raise → 用户 raise → 判定 "win"
  - GTO 推荐 fold → 用户 fold → 判定 "win"
  
  实际牌局结果取决于公共牌摊牌后手牌大小的比较，而非动作是否匹配 GTO。这个简化让所有"正确决策"都算赢，与真实扑克逻辑脱节。
- **修复**: 使用 `HandEvaluator.evaluate()` 比较实际手牌大小决定结果。

### 🟢 [FE-39] `excel-settlement-parser.ts` 和 `excel-parser.ts` 是两个完全独立的解析器
- **文件**: `excel-parser.ts` (积分记录) vs `excel-settlement-parser.ts` (清分数据)
- **问题**: 两个解析器各自读取不同的 Sheet（前者读"记录登记表"，后者读"积分表"），各自硬编码列索引，各自定义类型。没有共享的 Excel 读取基础设施。如果有第三个 Excel 功能（如手牌导入），需要写第三个解析器。
- **修复**: 抽取共享的 Excel 读取层（打开文件、遍历 Sheet、解析行），各业务解析器仅定义列映射。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 1 | 0 | 1 | 2 |
| 交互逻辑弱 | 1 | 1 | 1 | 3 |
| 功能延申不合理 | 2 | 2 | 1 | 5 |
| **合计** | **4** | **3** | **3** | **10** |

### 本轮最严重发现

1. **[FE-35]** `coach-service.ts` 从 5 个不存在的 `@/lib/coach/*` 模块导入 — 项目可能无法编译
2. **[FE-36]** 教练模块 3 层架构全部互不相通 — DB 层 / Service 层 / Store 层各有不同问题
3. **[IX-42]** 小程序 10/13 页面为静态桩 — 产品完成度约 30%
4. **[FE-37]** 558 行专业扑克引擎仅被 1 个组件使用 — 严重低利用率
5. **[OP-33]** 训练设置盲注数据错误 — "5/10" 被映射为 50/100

### 📈 累计进度

| 轮次 | 新 | 累计 | 🔴 |
|------|-----|------|-----|
| 第 1 轮 | 18 | 18 | 8 |
| 第 2 轮 | 15 | 33 | 14 |
| 第 3 轮 | 14 | 47 | 19 |
| 第 4 轮 | 13 | 60 | 25 |
| 第 5 轮 | 11 | 71 | 29 |
| 第 6 轮 | 13 | 84 | 34 |
| 第 7 轮 | 12 | 96 | 39 |
| 第 8 轮 | 11 | 107 | 41 |
| 第 9 轮 | 10 | **117** | **45** |

### 🚨 第 9 轮后的关键洞察

poker-tracker 项目的最大矛盾是：**最好的代码和最多的空壳并存于同一个项目**。

| 最优秀的模块 | 最糟糕的模块 |
|------|------|
| `poker-engine.ts` (558行专业引擎) | `coach-store.ts` (481行 Math.random) |
| `award-service.ts` (13种奖项) | Coach `@/lib/coach/*` (5个不存在文件) |
| `HandEvaluator` (Cactus Kev 算法) | 小程序 10/13 页面为桩 |
| `session-service.ts` (完整状态机) | `data.ts` 遗留层 (14处依赖) |
