# UX/交互审计 · 第 11 轮

**日期**: 2026-06-24
**范围**: 种子数据、poker-card SVG 组件、小程序服务层、牌面解析函数重复、Coach UI 子组件
**方法**: 代码静态分析 + 重复函数检测 + 使用率统计

---

## 一、不便于操作（2 项）

### 🔴 [OP-38] 项目有 3 套独立的"牌面解析"函数
- **文件**: 
  - `poker-engine.ts:64` — `parseCardCode(code: string): Card | null` (返回数字Card类型)
  - `poker-card.tsx:81` — `parseBoardCards(boardStr: string)` (返回 `{suit, rank}` 对象)
  - `hand-page.tsx:54` — 内联 board 解析: `hand.board.split(" ").filter(Boolean).map(...)` (返回 Card[])
- **问题**: 三个函数做同一件事（解析牌面字符串），但返回类型各不相同（`Card` number / `{suit, rank}` / 内联）。新开发者想解析手牌字符串时，不知道用哪个。`parseBoardCards` 甚至没有在任何核心组件中使用——只被 `poker-card.tsx` 自身的 `BoardDisplay` 和 2 个 coach 组件调用。
- **修复**: 统一牌面解析入口：`poker-engine.ts` 的 `parseCardCode` 作为唯一解析函数，`parseBoardCards` 改为调用 `parseCardCode`。

### 🟡 [OP-39] `BoardDisplay` 组件定义后零使用
- **文件**: `poker-card.tsx:105-116`
- **问题**: `BoardDisplay` 将 board 字符串渲染为 SVG 扑克牌序列。但它**从未被任何组件 import**。所有board显示都在用 `card-selector.tsx` 的 `CardDisplay`（Tailwind HTML）而非 SVG。两个渲染系统并存但只有一套被用。
- **修复**: 决定唯一的卡牌渲染方式——要么全用 Tailwind `CardDisplay`，要么全用 SVG `PokerCard`。删除不用的那套。

---

## 二、交互逻辑弱（3 项）

### 🔴 [IX-48] `seed-records.ts` 种子数据包含 20+ 人真实姓名
- **文件**: `seed-records.ts` (~200行)
- **问题**: 种子数据包含约 20 个真实中文人名（"志"、"茄"、"润"、"谦"、"楠"、"杰仔"、"锦辉"、"卢老师"、"佳"、"达"、"柱"等）。这是开发者的私人朋友群体数据。对于公开仓库，这是**隐私泄露**；对于其他用户，这些名字没有任何意义，种子数据产生无意义的统计（如一登录就看到"卢老师 +4300"）。
- **修复**: 用通用的示例名（"Alice", "Bob", "Charlie"...）或纯虚构中文名替换。

### 🟡 [IX-49] `poker-card.tsx` 使用 SVG 扑克牌渲染，而 `card-selector.tsx` 使用 HTML/Tailwind — 两套渲染系统
- **文件**: `poker-card.tsx` (SVG) vs `card-selector.tsx:85-98` `CardDisplay` (HTML/Tailwind)
- **问题**: 同一个项目有两种扑克牌渲染方式：
  - SVG 版：高质量、可缩放、支持 3 种尺寸 — 仅被 coach 组件使用
  - HTML/Tailwind 版：内联样式、深色主题 — 被 hand-wizard/hand-page/quick-entry 使用
  
  两套视觉风格不统一（SVG 是白底红黑，Tailwind 是深底红灰），同一张 "Ah" 在两个地方看起来完全不同。
- **修复**: 统一为单一渲染方式。SVG `PokerCard` 质量更高，建议全项目统一使用。

### 🟢 [IX-50] poker-weapp `clearService` 有完整 API 但 `clearPage` 仍是桩
- **文件**: `clearService.ts` (40行, 4个API方法) vs `clear/index.tsx` (21行, 纯静态)
- **问题**: 服务层已定义 `addClearRecord`、`listClearRecords`、`getSettlement`、`getClearWarnings` 四个云函数调用，但对应的 UI 页面仍然是"清分操作开发中..."。这是小程序中**第 11 个**服务层已完成但 UI 未实现的案例。
- **修复**: 优先级排序——要么实现 UI，要么从导航中移除入口。

---

## 三、功能延申不合理（2 项）

### 🟡 [FE-43] `seed-records.ts` 使用 `data.ts` 的旧版 `PokerRecord` 类型（无 id/seasonId/sessionId）
- **文件**: `seed-records.ts:1`
- **问题**: `import type { PokerRecord } from './data'` — 种子数据使用旧版 `PokerRecord`（4字段），无 `id`、`seasonId`、`sessionId`。当这些数据通过 API 插入 SQLite 时，Drizzle 的 `$defaultFn` 自动生成 id 和 createdAt，但 `seasonId` 和 `sessionId` 会留空。这意味着种子数据**不属于任何赛季**——在赛季过滤视图中永远不会出现。
- **修复**: 种子数据应使用 `types.ts` 的完整 `PokerRecord` 类型，并关联到种子赛季。

### 🟢 [FE-44] `poker-card.tsx` 的 SUIT_SYMBOLS/SUIT_COLORS 与 `poker-engine.ts` 的 SUIT_SYMBOL/SUIT_COLOR 重复
- **文件**: `poker-card.tsx:8-21` vs `poker-engine.ts:16-19`
- **问题**: 两个文件各自定义了花色的 symbol 和 color 映射：
  - poker-engine: `SUIT_SYMBOL['h'] = "♥"`, `SUIT_COLOR['h'] = "text-red-400"` (Tailwind class)
  - poker-card: `SUIT_SYMBOLS['heart'] = "♥"`, `SUIT_COLORS['heart'] = "#ef4444"` (hex color)
  
  键名不同（`'h'` vs `'heart'`），值类型不同（Tailwind class vs hex）。功能完全重复但无法互相替换。
- **修复**: poker-engine 已定义花色常量为权威来源，poker-card 应从中派生 SVG 可用的 hex 颜色。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 1 | 1 | 0 | 2 |
| 交互逻辑弱 | 1 | 1 | 1 | 3 |
| 功能延申不合理 | 0 | 1 | 1 | 2 |
| **合计** | **2** | **3** | **2** | **7** |

### 本轮最严重发现

1. **[IX-48]** 种子数据含 20+ 真实朋友姓名 — 隐私泄露
2. **[OP-38]** 3 套独立牌面解析函数 — `parseCardCode` / `parseBoardCards` / 内联解析
3. **[IX-49]** SVG PokerCard vs Tailwind CardDisplay — 两套视觉不统一的牌面渲染
4. **[FE-43]** 种子数据用旧版 PokerRecord 类型 — 无赛季关联
5. **[OP-39]** `BoardDisplay` 组件零使用

### 📈 累计进度

| 轮次 | 新 | 累计 | 🔴 |
|------|-----|------|-----|
| 1-11 | 7 | **133** | **50** |
