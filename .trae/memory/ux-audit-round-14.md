# UX/交互审计 · 第 14 轮

**日期**: 2026-06-24
**范围**: 性能反模式、最终死代码扫描、跨模块一致性、可用性细节
**方法**: 代码静态分析 + 组件使用率终结扫描

---

## 一、不便于操作（2 项）

### 🟡 [OP-43] `hand-page.tsx` 在每次 `activeSeasonId` 变化时发起 2 次独立 API 请求
- **文件**: `hand-page.tsx:207-223`
- **问题**: `useEffect` 各有一个独立的 fetch 调用加载 `incompleteHands` 和 `savedHands`。当 `activeSeasonId` 变化时，两个 effect 同时触发，产生 2 个并发 API 请求。但这两个请求的区别仅是 `is_complete=true` vs `is_complete=false`——可以合并为一次请求 `GET /api/hands?season_id=X` 返回全部手牌，前端按 `isComplete` 分组。
- **修复**: 合并为一次 API 请求，前端分组。

### 🟢 [OP-44] `page.tsx` 的 `loadData` effect 缺少 cleanup/abort
- **文件**: `page.tsx:54-94`
- **问题**: `useEffect` 内部调用 `Promise.all([apiGet(...) x 4])`。如果组件因路由切换而卸载，这些 fetch 请求**不会被取消**——没有 `AbortController`。在快速切换页面时可能导致状态更新到已卸载组件（React 18+ 有警告但不会 crash）。
- **修复**: 添加 `AbortController` 并在 cleanup 中 `abort()`。

---

## 二、交互逻辑弱（1 项）

### 🟡 [IX-55] 所有 `useMemo`/`useCallback` 依赖数组使用了 `as` 类型断言，可能隐藏依赖变化
- **文件**: 多处（`season-report-client.tsx`、`dashboard.tsx`、`hand-page.tsx`）
- **问题**: 代码中大量使用 `allRecords as PokerRecord[]` 和 `seasons as Season[]` 作为 `useMemo`/`useCallback` 的依赖。当 store 中的原始数据变化但引用不变时，memo 不会重新计算。这不一定是 bug——因为 Zustand 通常返回相同引用——但 `as` 断言掩盖了类型不匹配的事实。
- **修复**: 修复双轨类型问题（[[UX-Audit-Round-4]] IX-20），消除 `as` 断言的必要性。

---

## 三、功能延申不合理（2 项）

### 🟡 [FE-47] `record-entry.tsx`、`entry-status.tsx`、`score-validator.tsx` 确认为死代码
- **文件**: `record-entry.tsx` ~220行, `entry-status.tsx`, `score-validator.tsx`
- **问题**: 继 [[UX-Audit-Round-6]] OP-23 后进一步确认：`record-entry.tsx` 全项目零 import。其子组件 `entry-status.tsx` 和 `score-validator.tsx` 也未被任何活动组件引用。这 3 个文件共 ~300 行死代码，是 Phase 0 重构后遗留。
- **修复**: 删除这些文件。

### 🟢 [FE-48] `.agents/skills/` 中的 `image-to-code`、`imagegen-*` 等 Skill 需要图像生成能力
- **文件**: `.agents/skills/image-to-code/SKILL.md` 等
- **问题**: 图像生成类 Skill (image-to-code, imagegen-frontend-web, imagegen-frontend-mobile) 需要多模态图像生成能力，但 Claude Code 中的模型可能不支持。这些 Skill 在当前环境中**永远无法被触发**，占用了 context。
- **修复**: 移除此项目不需要的图像生成 Skill。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 0 | 1 | 1 | 2 |
| 交互逻辑弱 | 0 | 1 | 0 | 1 |
| 功能延申不合理 | 0 | 1 | 1 | 2 |
| **合计** | **0** | **3** | **2** | **5** |

### 📈 累计：146 问题，53 高优先级

所有 14 轮发现已覆盖全项目。下一轮（第 15 轮）为综合终审报告。
