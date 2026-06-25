# UX/交互审计 · 第 2 轮

**日期**: 2026-06-24
**范围**: 排行页、教练模块、AI分析、赛季结束、个人设置、导入/导出
**方法**: 代码静态分析 + 交互逻辑审查

---

## 一、不便于操作（5 项）

### 🔴 [OP-07] 教练模块全部基于 Mock 随机数据，没有任何后端真实逻辑
- **文件**: `coach-store.ts` (全文件 481 行)
- **问题**: `generateRandomHoleCards()` (line 19)、`estimateEquity()` (line 42)、`getMockGTOAdvice()` (line 64) 全部是前端随机数 + 启发式规则。`estimateEquity` 只看 isPair/isSuited/hasAce 三个 boolean，完全不考虑公共牌与手牌的实际组合关系。用户点击"开始训练"后面对的是**完全随机的假数据**，训练没有任何实际价值。
- **修复**: 要么接入真实的 poker hand evaluator（项目中已有 `poker-engine.ts` 的 `HandEvaluator`），要么在 UI 上明确标注 "演示模式 / 真实引擎开发中"。

### 🔴 [OP-08] AI 分析 PRESETS 硬编码了特定玩家名
- **文件**: `ai-analysis.tsx:22`
- **问题**: `'如果下一场参加的玩家是佳、茄、润、谦、卢老师，根据历史数据预测可能的结果。'` — 这是硬编码的特定朋友局玩家名。对于其他用户群体，这个预设完全无用且暴露了开发者私人数据。
- **修复**: 将"对局预测"预设改为动态从 stats.players 读取前 5 个玩家名。

### 🟡 [OP-09] 赛季结束对话框 `incompleteHandsCount` 始终为 0
- **文件**: `profile-page.tsx:221` → `end-season-dialog.tsx:28`
- **问题**: `profile-page.tsx` 传给 `EndSeasonDialog` 的 `incompleteHandsCount={0}` 是硬编码的。即使数据库中有未完成手牌，赛季结束的盘点清单也永远不会显示手牌警告。这导致盘点清单中的"手牌记录"检查项形同虚设。
- **修复**: 从 API 加载实际的不完整手牌数量并传入。

### 🟡 [OP-10] 排行页 5 个榜单全部 eager-render，无懒加载
- **文件**: `ranking-page.tsx:78-220`
- **问题**: `sections` 数组中的 5 个榜单（龙虎榜/胜率榜/场均/清分榜/出勤榜）通过 `section.render()` 同步渲染，即使折叠状态也存在于 DOM 中。对于数据量大时（如 50+ 玩家），会造成不必要的渲染开销。
- **修复**: 折叠的榜单不渲染内容，展开时再渲染。

### 🟡 [OP-11] 导入/导出功能分散在多个位置，入口不一致
- **文件**: `profile-page.tsx:188-203` + `import-status/page.tsx` + `collaborative-entry.tsx:785-851`
- **问题**: JSON 导出入在"个人设置"页，Excel 导入状态在独立的 `/import-status` 路由页，数据重置在录入页。用户要做数据管理需要在 3 个不同页面间跳转。
- **修复**: 将所有数据管理功能集中到统一的"数据管理"页面或面板。

---

## 二、交互逻辑弱（6 项）

### 🔴 [IX-08] 教练模块用户行动后无视觉反馈过渡
- **文件**: `coach-store.ts:329-416`
- **问题**: `recordDecision()` 在一次调用中完成了：用户行动 → 对手响应 → 牌局结果判定 的全流程。对于用户来说，点击"加注"按钮后瞬间显示结果，**完全看不到对手的响应过程**。没有动画、没有延迟、没有"对手思考中..."的过渡状态。
- **修复**: 拆分 `recordDecision` 为两步：先展示对手响应（带延迟动画），再展示结果。

### 🔴 [IX-09] AI 分析缓存管理有 bug：去重逻辑不可靠
- **文件**: `ai-analysis.tsx:143`
- **问题**: `persistCache([newCache, ...cache.filter(c => c.label !== cacheLabel || c.prompt !== prompt)])` — 用 `label !== cacheLabel || c.prompt !== prompt` 去重，但这个条件会保留 `label` 不同但 `prompt` 相同的条目，以及 `label` 相同但修改过 `prompt` 的条目。实际上是"同 label 同 prompt 才去重"，但 prompt 可能被用户手动修改。更关键的是**自定义提问的 label 为 undefined**，导致 `filter` 永远不去重自定义提问。
- **修复**: 使用唯一 ID（如 `label + hash(prompt)`）作为去重键。

### 🟡 [IX-10] 赛季结束 3 步流程中，"确认结束赛季"按钮无二次确认
- **文件**: `end-season-dialog.tsx:229`
- **问题**: 第三步（确认步骤）中 `AlertDialogAction` 直接调用 `onConfirm`。虽然展示了警告信息，但按钮文案 "确认结束赛季" 与普通 AlertDialog 的确认按钮样式一致，用户可能误触。
- **修复**: 在第三步增加输入框确认（类似 reset 的 "输入 RESET"）或按钮变色为红色。

### 🟡 [IX-11] 排行页玩家点击行为不一致
- **文件**: `ranking-page.tsx:91,118,146`
- **问题**: 5 个榜单的 `onPlayerClick` 都调用 `onPlayerClick?.(p.name)` 打开 PlayerDialog。但"龙虎榜"中点击第 4 名及以后的玩家也可能打开弹窗——而这些玩家的数据通常较少。没有区分"有足够数据值得深入查看"和"数据太少看了也没意义"。
- **修复**: 对 games < 3 的玩家，点击时显示简化版信息或提示"数据不足"。

### 🟡 [IX-12] 底部导航中 `/import-status` 和 `/season-report` 是独立路由，但导航栏不显示"当前激活"
- **文件**: `page.tsx:200-213`
- **问题**: 底部 5 个入口中，前 3 个（首页/记录/排行）通过 `activeTab` 高亮，后 2 个（导入/赛季报告）是 `<Link>` 跳转到独立路由。当用户在 `/import-status` 页面时，底部导航**没有高亮**"导入"按钮，用户不知道自己在哪里。
- **修复**: 使用 `usePathname()` 检测当前路由并高亮对应按钮。

### 🟢 [IX-13] ProfilePage "默认玩家名"保存后无视觉确认
- **文件**: `profile-page.tsx:70-74`
- **问题**: 保存后 `setMsg` 设置成功消息，但输入框值没有变化反馈。且这个"默认玩家名"功能只有保存和读取 localStorage，在使用时（录入页）是否真的被应用需要验证。
- **修复**: 检查录入页是否读取了 `poker-default-player`，添加自动填充的实际联动。

---

## 三、功能延申不合理（4 项）

### 🔴 [FE-06] 教练模块有 14 个 UI 组件 + 6 个 API 但全部是空壳
- **文件**: `coach-store.ts` + 14 个 `coach/*.tsx` + 6 个 `coach/**/route.ts`
- **问题**: 这是整个项目最严重的"过度建设"问题。教练模块拥有：
  - 14 个精心排版的 UI 组件（training-table、gto-advice-panel、equity-display...）
  - 6 个 API 端点
  - `CoachSession`、`CoachDecision`、`CoachFeedback`、`CoachReviewReport` 等完整类型定义
  - 481 行的 Zustand store
  
  但**全部逻辑是用 `Math.random()` 模拟的**。`estimateEquity` 不考虑公共牌，`getMockGTOAdvice` 只检查 3 个 boolean。整个模块给用户的体验是"看起来很专业，实际上完全随机"。这在产品层面是**严重的信任危机**——用户花时间"训练"后得到的反馈毫无意义。
- **修复**: 选项 A：接入 `poker-engine.ts` 的 `HandEvaluator` 做真实 equity 计算。选项 B：暂时隐藏教练模块入口，标注 "Coming Soon"。

### 🔴 [FE-07] AI 分析发送用户 API Key 到自己的后端
- **文件**: `ai-analysis.tsx:84-86`
- **问题**: `const configPayload = aiConfig.apiKey ? { apiKey: aiConfig.apiKey, baseUrl: aiConfig.baseUrl, model: aiConfig.model } : ...` — 用户的第三方 API Key 被发送到项目的 `/api/ai-analysis` 路由。这意味着服务器端可以看到用户的 API Key。对于隐私敏感用户这是**不可接受的**。
- **修复**: AI 调用应该直接从客户端发起（浏览器 fetch 到 AI provider），或者明确告知用户 Key 会经过服务器并取得同意。

### 🟡 [FE-08] 教练模块的 GTO 建议与 hand-wizard 的 GTO 引擎是两套完全不同的系统
- **文件**: `coach-store.ts` (mock) vs `gto-engine.ts` (hand-wizard 使用)
- **问题**: hand-wizard.tsx 使用 `gto-engine.ts` 中的 `getGTORecommendation()` 获取翻前 GTO 建议（基于真实 range 数据），而 coach-store.ts 使用自己的 `getMockGTOAdvice()`（3 个 boolean 判断）。**同一个项目有两个 GTO 引擎**，一个真实、一个随机。用户在不同入口得到的 GTO 建议质量完全不同。
- **修复**: 统一使用 `gto-engine.ts` 作为唯一 GTO 建议来源。

### 🟢 [FE-09] share-card.tsx 引用 `ShareCardData` 类型来自错误的路径
- **文件**: `share-card.tsx:3-4`
- **问题**: `import type { ShareCardData } from "@/services/share-service"` 但 `page.tsx` 中定义的 `ShareCardData` 在 `@/lib/types.ts:256-262`。两边类型定义不一致——`share-service` 的版本可能缺少字段或字段不同。
- **修复**: 统一从 `@/lib/types` 导出 `ShareCardData`。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 2 | 3 | 0 | 5 |
| 交互逻辑弱 | 2 | 3 | 1 | 6 |
| 功能延申不合理 | 2 | 1 | 1 | 4 |
| **合计** | **6** | **7** | **2** | **15** |

### 本轮 Top 发现

1. **[FE-06]** 教练模块 14 组件 + 6 API 全用 Math.random() 模拟 — 最大的信任危机
2. **[FE-07]** AI 分析将用户 API Key 发送到后端 — 隐私风险
3. **[OP-07]** 教练训练结果完全随机，无实际训练价值
4. **[OP-08]** AI 预设硬编码开发者朋友的名字
5. **[IX-08]** 教练模块用户行动无对手响应动画，瞬出结果
