# UX/交互审计 · 第 8 轮

**日期**: 2026-06-24
**范围**: poker-engine 深入、教练子组件、无障碍审计、奖项系统、安全性、重复代码
**方法**: 代码静态分析 + 无障碍扫描 + 重复代码检测 + 安全审查

---

## 一、不便于操作（3 项）

### 🔴 [OP-30] 自定义扑克组件零无障碍支持 — 键盘用户无法使用
- **文件**: `hand-wizard.tsx`、`quick-entry-wizard.tsx`、`card-selector.tsx`、`collaborative-entry.tsx` 等全部自定义组件
- **问题**: 27 个文件有 ARIA 属性，但全部来自 shadcn/ui 库组件。项目自定义的扑克组件（手牌向导、快速录入、牌面选择器、协作录入等）**没有任何**：
  - `aria-label` / `aria-labelledby`
  - `role` 语义化
  - `tabIndex` / 键盘导航
  - `onKeyDown` / 键盘事件处理
  - 焦点管理（focus trap in dialogs, focus restore after close）
  
  这意味着依赖键盘或屏幕阅读器的用户**完全无法使用**核心功能。
- **修复**: 至少为关键交互元素（牌面选择器、步骤按钮、玩家行）添加键盘导航和 ARIA 标签。

### 🔴 [OP-31] AI API Key 存储在 localStorage — XSS 可窃取
- **文件**: `ai-config-store.ts:28-40` + Zustand persist (`name: "poker-ai-config"`)
- **问题**: `ai-config-store` 使用 Zustand `persist` 中间件将 `apiKey` 保存到 `localStorage`。localStorage 对同源 JavaScript 完全开放，任何成功的 XSS 攻击都可以通过 `localStorage.getItem("poker-ai-config")` 读取用户的第三方 API Key。而且 `resetConfig()` 只清空内存中的 config，localStorage 中的旧 Key 不会自动清除。
- **修复**: 选项 A — 使用 `sessionStorage`（标签页关闭后清除）。选项 B — 不持久化 API Key，要求用户每次会话输入。选项 C — 使用 httpOnly cookie 由后端管理。

### 🟢 [OP-32] `season-comparison.tsx` 和 `stats-dashboard.tsx` 有重复的 `totalFlow` 计算
- **文件**: `season-comparison.tsx:69-85` vs `stats-dashboard.tsx:51-58`
- **问题**: 两处独立实现了完全相同的"总积分流动"计算（wins sum + losses abs sum）。如果计算公式需要调整，需要修改两个地方。
- **修复**: 提取 `computeTotalFlow(stats: ComputedStats)` 到 `stats-service.ts`。

---

## 二、交互逻辑弱（4 项）

### 🟡 [IX-38] `training-table.tsx` 在 "等待对手行动" 状态显示 "进入下一轮" 按钮
- **文件**: `training-table.tsx:200-209`
- **问题**: 当 `!isUserTurn && !isHandComplete`（等待对手行动），UI 显示：
  ```tsx
  <div className="text-xs text-muted-foreground/50">等待对手行动...</div>
  <button onClick={handleAdvanceStreet}>进入下一轮</button>
  ```
  "等待对手行动..." + "进入下一轮"两个元素同时存在，语义矛盾。用户可能误以为"进入下一轮"就是对手行动的结果，实际点击只是跳过。
- **修复**: 分离状态：真正的等待中应只显示 loading 动画；手动翻牌只在"等待太久"时才出现并标记为 "⏩ 跳过等待"。

### 🟡 [IX-39] `action-buttons.tsx` 所有按钮文案为英文（Fold/Check/Call/Raise/All-in）
- **文件**: `action-buttons.tsx:68,79,89,100,110`
- **问题**: 教练模块是面向中文用户的产品，但所有动作按钮使用英文（Fold/Check/Call/Raise/All-in），与项目其他部分的全面中文化不一致。hand-wizard 中的动作按钮使用中文（"弃牌"/"过牌"/"跟注"），但 coach 模块用英文。
- **修复**: 统一使用中文按钮文案。

### 🟡 [IX-40] `season-awards.tsx` 使用 `computeExtendedAwards(stats, [])` — 传递空 settlements
- **文件**: `season-awards.tsx:17`
- **问题**: `computeExtendedAwards(stats, [])` — settlements 参数被传为空数组。但 `AWARD_DEFINITIONS` 中的 `compute` 函数签名是 `(stats, settlements)`，很多奖项计算中 settlements 参数未被使用，但"清分类"奖项需要 settlements 数据。这意味着**所有需要 settlements 的奖项永远不会被评选**（如果有的话）。
- **修复**: 传入实际的 settlements 数据，或在不需要时从 `SeasonAwards` props 中获取。

### 🟢 [IX-41] `layout.tsx` 缺少 viewport meta 和 favicon
- **文件**: `layout.tsx:1-25`
- **问题**: Next.js 的 `metadata` export 只有 `title` 和 `description`，缺少：
  - `viewport`（Next.js 16 需要显式声明）
  - `icons`（favicon 配置）
  - `themeColor`
  - `openGraph`（分享时的预览卡片）
  
  虽然是 `app/layout.tsx` 的 metadata，但缺少这些基本信息会导致 SEO 和分享体验较差。
- **修复**: 补充 `viewport`、`icons`、`openGraph` 等 metadata。

---

## 三、功能延申不合理（4 项）

### 🟡 [FE-31] `award-service.ts` 是项目最优秀的模块——但仅被 1 个组件使用
- **文件**: `award-service.ts` (268行, 13 种奖项) → 仅 `season-awards.tsx` 调用
- **问题**: `AWARD_DEFINITIONS` 采用声明式数组 + 统一 `compute` 接口，配置与计算分离，有标准差计算、空状态处理。这是**全项目代码质量最高的模块**——但仅在赛季报告的一个子组件中使用。排行榜的 `awards-page.tsx` 和 `awards.tsx` 分别实现了自己的奖项逻辑（前者从 DB `awardRecords` 读取，后者显示静态 `Award` props），与 `award-service.ts` 完全无关。
- **修复**: 统一所有奖项相关页面使用 `award-service.ts` 作为单一数据源。

### 🟡 [FE-32] `award-service.ts` 中有 13 个奖项，但 3 个颁奖入口各有独立实现
- **文件**: 
  - `award-service.ts` — 13 种奖项（声明式 compute）
  - `awards-page.tsx` — 从 DB awardRecords 读取
  - `awards.tsx` — 简单 props 渲染
- **问题**: 三个"颁奖"功能各自独立实现，奖项集不同、计算方式不同。用户在排行榜看到一套奖项，赛季报告看到另一套。
- **修复**: 统一奖项计算和展示逻辑。

### 🟡 [FE-33] 项目中共有 5 个不同的排行榜/榜单组件，各用不同的数据源
- **文件**: 
  - `ranking-page.tsx` (龙虎榜/胜率榜/场均/清分/出勤)
  - `dashboard.tsx` (龙虎榜 + 图表)
  - `season-report.tsx` (赛季汇总)
  - `awards-page.tsx` (奖项展示)
  - `stats-dashboard.tsx` (赛季看板)
- **问题**: 5 个组件各自计算排名和统计数据，但**没有共享的"排行榜"数据层**。每个都直接调用 `computeStats()`、排序、过滤。如果排名规则改变（如改为按场均而非总分），需要修改 5 处。
- **修复**: 抽取共享的 `useRanking(records, type)` hook。

### 🟢 [FE-34] `award-service.ts` 中 `standardDeviation` 是用 `reduce` 手写的——应用了两次遍历
- **文件**: `award-service.ts:13-17`
- **问题**: 标准差计算先 `reduce` 算 mean，再 `reduce` 算 variance。对于大数据集这需要两次遍历。现代 JavaScript 引擎有 `Math.hypot` 等优化，但更重要的是缺少单位测试覆盖——标准差计算一旦有 bug 很难发现。
- **修复**: 为 `standardDeviation` 和每个 `award.compute` 添加单元测试。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 2 | 0 | 1 | 3 |
| 交互逻辑弱 | 0 | 3 | 1 | 4 |
| 功能延申不合理 | 0 | 3 | 1 | 4 |
| **合计** | **2** | **6** | **3** | **11** |

### 本轮最严重发现

1. **[OP-30]** 自定义扑克组件零无障碍 — 键盘/屏幕阅读器用户完全无法使用
2. **[OP-31]** AI API Key 存在 localStorage — XSS 可窃取
3. **[FE-31]** 最优代码模块 `award-service.ts` 仅被 1 处使用 — 奖项系统碎片化
4. **[IX-38]** 教练"等待对手行动"和"进入下一轮"并存 — 交互矛盾
5. **[IX-39]** 教练按钮全英文 vs 项目其他全中文 — 语言不一致

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
| 第 8 轮 | 11 | **107** | **41** |

### 🔥 系统模式深度分析

经过 8 轮审计，问题已从表面的单点交互缺陷深入到了系统架构层面：

| 层级 | 问题类型 | 典型表现 |
|------|------|------|
| **组件层** | 静默失败/无反馈 | 按钮禁用无提示、API 错误后关闭表单 |
| **模块层** | 重复代码/逻辑 | 14处评分颜色、totalFlow 重复、5个榜单各自排序 |
| **架构层** | 双轨系统 | data.ts vs types.ts、Web vs 小程序、DB 清分 vs Excel 清分 |
| **产品层** | 桩代码/空壳 | 小程序 3 个 Tab、Coach 全 Mock、教练 DB 表空置 |
| **工程层** | 零测试/硬编码 | vitest 无项目测试、Windows 路径硬编码、bash 脚本 |
| **安全层** | API Key 泄漏 | localStorage 持久化、API 路由转发 Key、seed 无认证 |
