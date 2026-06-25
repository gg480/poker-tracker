# UX/交互审计 · 第 1 轮

**日期**: 2026-06-24
**范围**: poker-tracker 全项目
**方法**: 代码静态分析 + 交互逻辑审查

---

## 一、不便于操作（6 项）

### 🔴 [OP-01] QuickEntryWizard Step 3 保存按钮静默失败
- **文件**: `quick-entry-wizard.tsx:29`
- **问题**: `if (heroCards.length !== 2 || !result || !tag) return` — 用户点击"保存"按钮时如果条件不满足，按钮禁用了但**没有任何文字提示**说明缺少什么。用户会困惑为何按钮点不了。
- **修复**: 在按钮下方显示具体的缺失提示（如"请选择手牌"、"请选择结果"）。

### 🔴 [OP-02] 快速记录的手牌数据存储混乱
- **文件**: `hand-page.tsx:329-340`
- **问题**: `handleQuickSave` 将 hero cards 字符串同时存入了 `board` 字段（`board: heroCardsStr`），而 `board` 字段语义上是公共牌。这是**数据污染**，会导致后续读取时 board 字段内容不可靠。
- **修复**: `board` 应置空或存储实际的 board cards，hero cards 只存入 `actions` JSON。

### 🔴 [OP-03] QuickEntryWizard 缺少积分输入
- **文件**: `quick-entry-wizard.tsx` + `quick-entry-store.ts`
- **问题**: 原始 task.md 设计 Store 时要求 `result: number`（积分），但实际实现只有 win/lose/split 三元选择。用户无法在快速模式记录输赢的具体金额，快速模式下记录"赢了 500"和"赢了 50"会被视为完全一样。
- **修复**: Step 2 增加积分数字输入框，或至少提供常用值快捷按钮。

### 🟡 [OP-04] hand-page.tsx 模板代码重复严重
- **文件**: `hand-page.tsx:226-397`
- **问题**: `handleWizardSave` 和 `handleQuickSave` 各自构建了一遍几乎相同的 API 请求体，各自处理 session 创建、PUT/POST 分支。约 170 行重复逻辑。修改保存行为需要同时改两处。
- **修复**: 提取公共的 `saveHand()` 函数，区分 new/edit/complete 三种模式。

### 🟡 [OP-05] season 过滤器无搜索/滚动优化
- **文件**: `page.tsx:145-147`
- **问题**: 赛季标签横向排列在 `overflow-x-auto` 容器中，赛季多时（如 10+ 个）用户需要水平滚动才能找到目标赛季。没有搜索框、下拉选择或折叠更多。
- **修复**: 赛季超过 5 个时切换为 `Select` 下拉，或添加"更多..."折叠按钮。

### 🟡 [OP-06] CardSelector 组件被导出但用法不统一
- **文件**: `quick-entry-wizard.tsx:88` vs `hand-wizard.tsx:203`
- **问题**: QuickEntryWizard 直接用 `CardSelector` 传 `selectedCards` 和 `onCardSelect`，而 HandWizard 包裹了 `handleHeroCardSelect` 来处理 toggle 逻辑。两个入口对同一组件的交互方式不一致——QuickEntryWizard 的 `setHeroCards([...heroCards, c])` 可能添加重复牌（CardSelector 内部不防重？需要确认），HandWizard 则明确防重。
- **修复**: QuickEntryWizard 应该也使用 toggle 逻辑而非追加。

---

## 二、交互逻辑弱（7 项）

### 🔴 [IX-01] QuickEntryWizard 无表单验证反馈
- **文件**: `quick-entry-wizard.tsx:88-95, 117-120, 148-151`
- **问题**: 三步流程每步的"下一步"按钮都是 `disabled` 条件禁用，但**没有任何错误文案**。用户面对灰色按钮，不知道缺少什么。这是最差的 UX 模式之一。
- **修复**: 每个 disabled 按钮下方/旁边增加条件不满足时的提示文字。

### 🔴 [IX-02] hand-page.tsx 无 API 错误恢复机制
- **文件**: `hand-page.tsx:226-397`
- **问题**: `handleWizardSave` 和 `handleQuickSave` 的 catch 块都只设置了"网络错误"消息（line 307, 396），**不恢复 UI 状态**。保存失败后 wizard 已被关闭（line 298），用户的数据丢失。
- **修复**: 保存失败时保持 wizard 打开，让用户可以重试。

### 🔴 [IX-03] 快速记录保存后无撤销能力
- **文件**: `hand-page.tsx:364-393`
- **问题**: 快速记录 POST 成功后直接关闭面板并加入到 `incompleteHands`。如果用户选错牌或标签，**没有任何撤销/编辑入口**——只能等列表刷新后点击"补全"进入完整向导修改。
- **修复**: 保存后显示 3 秒 toast 带"撤销"按钮，或允许点击已创建的 incomplete hand 直接编辑。

### 🟡 [IX-04] page.tsx 的数据加载失败时静默降级到种子数据
- **文件**: `page.tsx:81-86`
- **问题**: API 调用失败后直接加载种子数据，用户**完全感知不到**当前看到的是假数据还是真实数据。如果数据库连接断了但种子数据显示正常，用户会误以为一切正常。
- **修复**: 降级到种子数据时显示持久 banner："⚠️ 无法连接数据库，当前显示示例数据"。

### 🟡 [IX-05] 赛季标签无"活动赛季"视觉区分不足
- **文件**: `page.tsx:146`
- **问题**: 活动赛季用 `text-emerald-400/80` + 小绿点表示，但"全部"和"归档赛季"的颜色差异很小。用户可能难以一眼找到当前赛季。
- **修复**: 活动赛季加粗、加大，或始终排在最前面。

### 🟡 [IX-06] 底部导航栏拥挤且无当前页高亮说明
- **文件**: `page.tsx:179-213`
- **问题**: 底部导航有 5 个入口（首页/记录/排行/导入/赛季报告），空间拥挤。且 `import-status` 和 `season-report` 使用 `Link`（整页跳转），而非 tab 切换，行为不一致。
- **修复**: 考虑将"导入"和"赛季报告"移入"我的"页面作为子入口，保持 3 个主导航。

### 🟡 [IX-07] SessionList 空状态降级到按日期分组显示不一致
- **文件**: `session-list.tsx:62-131`
- **问题**: 当没有 GameSession 时，组件按 `records` 的 date 字段分组显示。这种降级行为 UI 完全不同（无 session 状态标签），用户容易困惑为什么有时候看到"已确认/待确认"有时候看不到。
- **修复**: 统一展示逻辑——无 session 时也生成虚拟 session 对象。

---

## 三、功能延申不合理（5 项）

### 🔴 [FE-01] 手牌记录 `players: "1"` — 单人德扑毫无意义
- **文件**: `hand-page.tsx:333`
- **问题**: 快速记录时 `players: "1"`，但德扑最少需要 2 人。这个字段存在数据库中，后续查询"几人桌"统计时会得到无意义的数据。
- **修复**: quick save 时 players 至少设为 "2" 或留空。

### 🔴 [FE-02] QuickEntryWizard 的 `cardName` 函数本地重复定义
- **文件**: `quick-entry-wizard.tsx:44-49`
- **问题**: `quick-entry-wizard.tsx` 内部重新定义了 `cardName()` 函数，而 `poker-engine.ts` 和 `card-selector.tsx` 已经导出了同名函数。这个本地副本与 poker-engine 的实现可能存在细微差异，且绕过了类型系统（使用 magic numbers `>> 4` `& 0xF`）。
- **修复**: 从 `./poker-engine` 导入 `cardName`，删除本地副本。

### 🟡 [FE-03] GTO 分析面板在 hand-wizard 中重复出现
- **文件**: `hand-wizard.tsx:252-320` (开局前) + `hand-wizard.tsx:442-459` (开局后)
- **问题**: 翻前 GTO 建议在"配置阶段"和"翻前进行中"各出现一次。用户同时在两处看到相同的 GTO 信息，造成冗余和困惑——应该只有一处。
- **修复**: 只在翻前进行中显示 GTO 面板，开局前的配置阶段不显示。

### 🟡 [FE-04] 教练模块有完整 UI 但后端为空壳
- **文件**: `coach-page.tsx` + `coach-store.ts` + 14 个 coach 组件 + 6 个 coach API 路由
- **问题**: Coach 模块有 14 个精心排版的 UI 组件、6 个 API 端点、详细的 TypeScript 类型定义…但 `coach-store.ts` 中的 session/decision 数据**全部来自 local state**，API routes 可能只是 stub。这给用户一个"功能可用"的假象，实际点击"开始训练"后可能没有真实的后端模拟引擎。
- **修复**: 如果后端未完成，在 UI 上明确标注"Beta / 即将推出"，避免用户期望落差。

### 🟢 [FE-05] `hand-page.tsx` 同时管理 savedHands 和 incompleteHands 两个列表
- **文件**: `hand-page.tsx:176-223`
- **问题**: 组件内部维护了两个独立的 hands 列表（`savedHands` 和 `incompleteHands`），各自的加载逻辑分开。但实际上它们都来自同一个 API（只是 `is_complete` 参数不同）。这种设计导致：① 两次 API 请求（可以做一次）；② 补全操作后需要手动在两个列表间移动数据。
- **修复**: 合并为单个 `hands: HandRecord[]` 列表，用 `isComplete` 字段在前端分组显示。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 3 | 3 | 0 | 6 |
| 交互逻辑弱 | 3 | 4 | 0 | 7 |
| 功能延申不合理 | 2 | 2 | 1 | 5 |
| **合计** | **8** | **9** | **1** | **18** |

### Top 5 优先修复

1. **[OP-01]** QuickEntryWizard 静默失败 — 用户可见性最高
2. **[IX-01]** 三步向导缺验证反馈 — 同上
3. **[IX-02]** API 错误后数据丢失 — 数据安全
4. **[OP-02]** board 字段语义错误 — 数据污染
5. **[FE-02]** cardName 本地重复定义 — 代码质量 & 潜在 bug
