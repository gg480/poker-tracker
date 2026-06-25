# UX/交互审计 · 第 10 轮

**日期**: 2026-06-24
**范围**: card-selector 完整实现、通用组件使用率、全局样式、教练面板、AI 配置、种子数据
**方法**: 代码静态分析 + 组件引用统计 + CSS 审查

---

## 一、不便于操作（3 项）

### 🔴 [OP-35] CardSelector 52 张牌按钮零无障碍标签
- **文件**: `card-selector.tsx:63-73`
- **问题**: 52 个按钮（13 个 rank × 4 个 suit）只用 rank 字母作为文本（"A", "K", "Q" 等），没有任何 `aria-label`。屏幕阅读器用户听到的是 "A button"、"K button" 等含糊描述，无法判断每张牌的花色和已被选中的状态。
- **修复**: 为每个按钮添加 `aria-label={${rank}${SUIT_SYMBOL[suit]} ${isSelected ? '已选' : ''}}`。

### 🟡 [OP-36] `PlayerSelect` 是原生 `<select>`，无搜索/自动完成
- **文件**: `player-select.tsx:18-31`
- **问题**: 使用纯 HTML `<select>` 元素。当玩家列表增长到 20+ 人时，用户需要在长下拉框中滚动查找。没有搜索过滤、没有自动完成、没有分组。
- **修复**: 使用 shadcn/ui 的 `Command`（cmdk）组件替换，支持搜索和键盘导航。但首先需要确认此组件是否被使用。

### 🟡 [OP-37] `globals.css` 字体从 `fonts.googleapis.cn` 加载 — 境外用户受阻
- **文件**: `globals.css:1`
- **问题**: `@import "https://fonts.googleapis.cn/css2?..."` 使用中国 Google Fonts 镜像。境外用户访问时这个 CDN 可能不可用，导致字体加载失败。同时 `@import` 是 CSS 阻塞加载，会延迟首屏渲染。
- **修复**: 使用标准 `fonts.googleapis.com`，并在 `layout.tsx` 中用 `<link rel="preconnect">` 预连接。

---

## 二、交互逻辑弱（3 项）

### 🔴 [IX-45] `TrainingLayout` 和 `TrainingTable` 重复计算相同的 derived state
- **文件**: `training-layout.tsx:20-42` vs `training-table.tsx:30-60`
- **问题**: 两个组件各自独立调用 `useMemo` 计算 `advice`、`equity`、`potOdds`、`ev`、`feedback`（5 个 derived values）。`TrainingLayout` 作为父组件计算了一份，`TrainingTable` 作为子组件又计算了完全相同的值。这意味着：
  - 每次 `holeCards` 变化时，5 个 useMemo 被执行 2 次（共 10 次计算）
  - 父组件传给 `CoachPanel` 的值和子组件自己用的值可能不同步
- **修复**: 在 `TrainingLayout` 中计算一次，通过 props 传递给 `TrainingTable`。

### 🟡 [IX-46] CardSelector 没有键盘导航支持 — 52 张牌只能鼠标点击
- **文件**: `card-selector.tsx:63`
- **问题**: 牌面选择器的 52 个 `<button>` 没有实现任何键盘导航模式（如 arrow keys 移动选择）。扑克中的标准输入流程：用户需要依次点击 Hero 手牌（2张）→ Flop（3张）→ Turn（1张）→ River（1张）。纯鼠标操作在这个流程中效率很低。
- **修复**: 添加 `onKeyDown` 处理，支持 arrow keys 在同花色的 rank 间移动，支持 Tab 在不同花色间跳转。

### 🟢 [IX-47] `CoachPanel` 训练提示是静态硬编码文本
- **文件**: `coach-panel.tsx:63-68`
- **问题**: "训练提示"区域的 3 条建议是纯静态文本，与当前训练上下文无关。例如当用户 equity 已经很低时仍显示"胜率 > 底池赔率时，跟注是 +EV"——这是一个**永远正确但无帮助**的建议。
- **修复**: 根据当前 handNumber、equity、player action history 动态生成个性化的训练提示。

---

## 三、功能延申不合理（3 项）

### 🔴 [FE-40] `MedalBadge`、`PlayerSelect`、`DatePicker` 3 个通用组件零使用
- **文件**: `medal-badge.tsx`、`player-select.tsx`、`date-picker.tsx`
- **问题**: Grep 统计确认这 3 个组件**只在自身定义文件中出现**，全项目零 import：
  - `MedalBadge` — 封装了 🥇🥈🥉 奖牌显示 → 从未被使用
  - `PlayerSelect` — 封装了玩家下拉选择 → 从未被使用（都用内联 `<Input list=>`）
  - `DatePicker` — 封装了日期选择器 → 从未被使用（都用 `<Input type="date">`）

  这与 [[UX-Audit-Round-7]] 中的 `ScoreDisplay` 零使用问题同源——通用组件建立后无人知晓/使用。
- **修复**: 要么全局替换内联实现为这些组件，要么删除死代码。

### 🟡 [FE-41] `globals.css` 定义了大量动画和特效类，但部分从未使用
- **文件**: `globals.css:139-247`
- **问题**: 定义了 `card-animate`、`gradient-shimmer`、`gold-glow`、`glass-card`、`spotlight-border` 等动画和特效类。Grep 检查：
  - `glass-card` 在 `dashboard.tsx` 和 `clear-radar-alerts.tsx` 中使用 ✅
  - `spotlight-border` 同上 ✅
  - `gradient-shimmer` — 未在任何组件中使用 ❌
  - `gold-glow` — 未在任何组件中使用 ❌
  - `card-animate` — 未在任何组件中使用 ❌
  
  这些未使用的动画类增加了 CSS bundle 体积。
- **修复**: 删除未使用的 CSS 类，或在合适的位置应用（如将 `gold-glow` 应用于排行榜前 3 名）。

### 🟢 [FE-42] `globals.css` 的 `noise-overlay` 使用 SVG data URI 作为噪点纹理
- **文件**: `globals.css:207-214`
- **问题**: `noise-overlay` 使用内联 SVG（`data:image/svg+xml,...`）通过 `feTurbulence` 生成噪点纹理。这个 200x200 的 SVG 纹理在 `layout.tsx` 中被渲染为全屏覆盖层（`fixed inset-0`），但 `opacity: 0.025` 意味着在大多数显示器上**完全不可见**。同时 `feTurbulence` 滤镜在移动设备上消耗 GPU 资源。
- **修复**: 提高 opacity 到 0.04-0.06 使其在高端显示器上可见，或添加 `@media (prefers-reduced-motion)` 禁用。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 1 | 2 | 0 | 3 |
| 交互逻辑弱 | 1 | 1 | 1 | 3 |
| 功能延申不合理 | 1 | 1 | 1 | 3 |
| **合计** | **3** | **4** | **2** | **9** |

### 本轮最严重发现

1. **[FE-40]** `MedalBadge` + `PlayerSelect` + `DatePicker` 全部零使用 — 又一个通用组件死代码集群
2. **[IX-45]** TrainingLayout/TrainingTable 重复计算 5 个 derived values — 每次更新计算 10 次
3. **[OP-35]** CardSelector 52 张牌按钮零 aria-label — 无障碍黑洞
4. **[OP-37]** 字体从中国 CDN 加载 — 境外用户无法使用
5. **[IX-46]** CardSelector 纯鼠标操作 — 键盘用户无法选牌

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
| 第 9 轮 | 10 | 117 | 45 |
| 第 10 轮 | 9 | **126** | **48** |
