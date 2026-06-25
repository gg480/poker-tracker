# UX/交互审计 · 第 7 轮

**日期**: 2026-06-24
**范围**: 小程序页面深度审计、教练训练 UI、共享组件使用率、骨架系统、数据库连接
**方法**: 代码静态分析 + 组件使用率统计 + 跨项目对比

---

## 一、不便于操作（4 项）

### 🔴 [OP-26] 微信小程序 3 个 Tab 页面都是静态桩 — 服务层已就绪但 UI 从未实现
- **文件**: `ranking/index.tsx`、`season/index.tsx`、`settings/index.tsx`
- **问题**: 三个页面均为纯静态硬编码文本：
  - **排行榜页**：显示 "暂无排行数据" + 3 个不可交互的 Tab
  - **我的页**：硬编码 "2026 春季赛" + 静态占位符
  - **设置页**：纯占位符卡片
  
  但对应的服务层 (`statsService.ts`、`seasonService.ts`) **已经定义了完整的 API 方法**（`getRanking`、`getWinRateRanking`、`getAttendanceRanking` 等）。UI 层从未被实现，意味着小程序用户只能录制场次，但**看不到任何统计数据**。
- **修复**: 实现排名页的数据加载和渲染，至少先完成龙虎榜。

### 🔴 [OP-27] `ScoreDisplay` 通用组件定义后零使用 — 14 处重复评分颜色逻辑
- **文件**: `score-display.tsx` (定义) vs 14 处内联重复
- **问题**: `ScoreDisplay` 组件封装了评分颜色 (`text-emerald-400` / `text-red-400`)、符号 (`+` 前缀)、数字格式化。但**全项目零次 import**！所有文件都在重复 `score > 0 ? "text-emerald-400" : "text-red-400"` 的三元表达式：
  ```
  hand-page.tsx      — 2 处
  hand-wizard.tsx    — 5 处
  ranking-page.tsx   — 2 处
  season-report.tsx  — 3 处
  end-season-dialog  — 1 处
  ```
  这是典型的"有人建了组件，其他人不知道"或"Tailwind 太方便以至于忘了有组件"反模式。
- **修复**: 全局替换内联评分颜色逻辑为 `<ScoreDisplay score={n} />`。

### 🟡 [OP-28] 骨架系统缺少 Coach 和 Import 骨架
- **文件**: `skeleton-page.tsx`
- **问题**: 骨架系统有 5 个变体（Home, Ranking, Hand, Record, Profile），但 Coach 模块和 Import Status 页面在加载时没有专用骨架。Coach 训练表和 Import 面板在数据加载时会直接空白，而非显示骨架动画。
- **修复**: 添加 `CoachSkeleton` 和 `ImportSkeleton` 组件。

### 🟢 [OP-29] 小程序 `season/index` 页面文件名与功能不匹配
- **文件**: `poker-weapp/src/pages/season/index/index.tsx`
- **问题**: 文件名叫 "season"（赛季），但页面标题显示 "我的"（个人中心），内容混合了赛季管理和个人设置。文件名和实际功能不匹配，新开发者会困惑。
- **修复**: 将页面拆分为独立的 "赛季管理" 和 "个人设置"，或重命名文件。

---

## 二、交互逻辑弱（4 项）

### 🔴 [IX-34] 小程序排行榜 Tab 切换完全是视觉装饰 — 无任何交互
- **文件**: `poker-weapp/src/pages/ranking/index/index.tsx:11-15`
- **问题**: 
  ```tsx
  <Text className={styles.tabActive}>龙虎榜</Text>
  <Text className={styles.tab}>胜率榜</Text>
  <Text className={styles.tab}>出勤榜</Text>
  ```
  这 3 个 Tab 使用**纯 `<Text>` 组件**而非 `<Button>` 或可点击元素。`tabActive` 样式硬编码在"龙虎榜"上，但**没有 `onClick`、没有 `useState`、没有条件渲染**。用户无论"点"哪个 Tab 都不会有任何反应。
- **修复**: 实现真正的 Tab 切换逻辑。

### 🔴 [IX-35] 小程序"我的"页硬编码赛季名 "2026 春季赛"
- **文件**: `poker-weapp/src/pages/season/index/index.tsx:14`
- **问题**: `<Text className={styles.placeholder}>2026 春季赛</Text>` — 赛季名硬编码。不管实际赛季是什么，用户看到的永远是 "2026 春季赛"。这在 2026 年夏季之后会变得荒谬。
- **修复**: 从 `useSeasonStore` 读取实际赛季名，无赛季时显示 "暂无赛季"。

### 🟡 [IX-36] `training-table.tsx` 的 "进入下一轮" 按钮在手牌未完成时也可点击
- **文件**: `training-table.tsx:193-197, 203-208`
- **问题**: "进入下一轮"（`handleAdvanceStreet`）按钮在两个地方都渲染了：
  - `isHandComplete` 时 (line 193-197)
  - `!isUserTurn && !isHandComplete` 时 (line 203-208)
  
  在第二个场景（等待对手行动时），点击"进入下一轮"会调用 `advanceStreet()`，这可能**跳过对手的响应**直接翻牌，破坏游戏流程。
- **修复**: 在非用户回合时，按钮应调用"模拟对手行动"而非"直接进入下一轮"。

### 🟢 [IX-37] 小程序 ranking 页面 tabs 使用 `<Text>` 而非语义化元素
- **文件**: `ranking/index.tsx:12-14`
- **问题**: Tab 切换使用纯 `<Text>` 组件。在微信小程序中，`<Text>` 不可聚焦、不支持键盘导航（无障碍）。应使用 `<Button>` 或 `<View>` 配合 `onClick`。
- **修复**: 使用语义化按钮元素并添加 ARIA 标签。

---

## 三、功能延申不合理（4 项）

### 🔴 [FE-27] 微信小程序 3 个主要 Tab 页面全为桩代码 — 产品不可用
- **文件**: `ranking/index.tsx`、`season/index.tsx`、`settings/index.tsx`
- **问题**: poker-weapp 有 5 个 Tab（首页/录入/排行/我的/设置），其中 **3 个（60%）是静态桩**。用户在这些页面看到的是永久的 "暂无数据" / "2026 春季赛" / "数据备份" 占位符。产品层面来看，小程序是一个**不可交付的半成品**。
- **修复**: 确定优先级——先完成排行页数据加载，再实现设置页的导入导出功能。

### 🟡 [FE-28] 小程序设置页定义了 "数据备份/恢复" 占位但无任何实现
- **文件**: `poker-weapp/src/pages/settings/index/index.tsx:12-19`
- **问题**: 设置页显示 "导出全部数据为 JSON" 和 "从 JSON 恢复数据" 的占位卡片，但这些卡片**不可点击、无任何交互**。`recordService.ts` 和 `seasonService.ts` 中也没有导出/导入的 API 方法定义。这是"先搭 UI 框架，再实现功能"的遗留——但框架搭好后再也没实现过。
- **修复**: 要么实现导入导出，要么移除这些占位卡片。

### 🟡 [FE-29] `drizzle.ts` 同时从 `schema.ts` 和 `coach-schema.ts` re-export — 符号来源混乱
- **文件**: `drizzle.ts:24-25`
- **问题**: 
  ```ts
  export * from "./shared/schema"
  export * from "./shared/coach-schema"
  ```
  两个 re-export 都包含 `generateId()` 函数（分别在两个文件中定义）。如果两个文件的 `generateId` 实现不同，导入方会得到一个不确定的版本。而且 `crud.ts` 从 `./shared/schema` 直接导入，有些模块可能从 `./drizzle` 导入——导致同一个符号有两个导入路径。
- **修复**: 移除 `drizzle.ts` 的 re-export，所有模块各自从明确的 schema 文件导入。

### 🟢 [FE-30] `score-display.tsx` 定义了 `showSign` prop 但 `+` 号对零分也有效
- **文件**: `score-display.tsx:15`
- **问题**: `const display = showSign && score > 0 ? \`+${score}\` : \`${score}\`` — 当 `showSign=false` 且 `score=0` 时显示 "0"，当 `showSign=true` 且 `score=0` 时也显示 "0"。逻辑上正确，但 name/behavior 稍有歧义：`showSign` 的含义是"正数显示 + 号"而非"显示符号"。
- **修复**: 重命名为 `showPlusSign` 或在 JSDoc 中注明。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 2 | 1 | 1 | 4 |
| 交互逻辑弱 | 2 | 1 | 1 | 4 |
| 功能延申不合理 | 1 | 2 | 1 | 4 |
| **合计** | **5** | **4** | **3** | **12** |

### 本轮最严重发现

1. **[FE-27]** 小程序 60% Tab 页面是静态桩 — 产品不可交付
2. **[OP-27]** `ScoreDisplay` 零使用 — 14 处 duplicate 颜色逻辑
3. **[IX-34]** 小程序排行榜 Tab 切换是纯装饰性文本
4. **[IX-35]** 小程序硬编码赛季名 "2026 春季赛"
5. **[IX-36]** 训练桌 "进入下一轮" 可能跳过对手行动

### 📈 累计进度

| 轮次 | 新问题 | 累计 | 🔴累计 |
|------|--------|------|--------|
| 第 1 轮 | 18 | 18 | 8 |
| 第 2 轮 | 15 | 33 | 14 |
| 第 3 轮 | 14 | 47 | 19 |
| 第 4 轮 | 13 | 60 | 25 |
| 第 5 轮 | 11 | 71 | 29 |
| 第 6 轮 | 13 | 84 | 34 |
| 第 7 轮 | 12 | **96** | **39** |

### 🔥 更新后的系统模式

| 模式 | 累计 | 说明 |
|------|:---:|------|
| 双轨类型/代码 | 8 | data.ts/types.ts、DB vs Excel 清分、Web vs 小程序 |
| 空壳/桩功能 | 9 | +3 (小程序 3 个 Tab 页全桩) |
| 重复代码/逻辑 | 6 | +1 (14 处评分颜色重复) |
| 硬编码 | 6 | +1 (小程序硬编码赛季名) |
| 未使用组件/依赖 | 7 | +1 (ScoreDisplay 零使用) |
