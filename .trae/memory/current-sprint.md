# 当前冲刺 · Poker Tracker

**冲刺名称**: Sprint 8 - 赛季总结报告
**版本**: 8.1
**日期**: 2026-06-17
**状态**: 🟢 已完成
**管理者**: @PM

---

## 1. 冲刺概述

### 1.1 冲刺目标

为用户生成**赛季总结报告**，以独立页面形式展示，包含图表、数据看板、大事记和赛季对比功能。所有数据从现有 API/Store 读取，纯前端改动。

**P0 — 核心功能（必须完成）**
- T-801: 赛季总结报告页面框架 — 新建独立页面，顶部导航入口
- T-802: 赛季数据看板 — 总场次/总人数/场均积分/最大赢家/最大输家/总积分流动
- T-803: 大事记列表 — 最大单场盈利/最长连胜/最大逆转/最活跃玩家等

**P1 — 增强功能（建议完成）**
- T-804: 积分走势图表 — 赛季内所有玩家积分变化叠加折线图（Recharts）
- T-805: 赛季颁奖 — 复用现有 AwardsPage 数据，展示获奖名单

**P2 — 扩展功能（选做）**
- T-806: 赛季对比 — 与上一赛季关键指标对比（参与人数/场均/总积分）

### 1.2 时间范围

- **开始日期**: 2026-05-10
- **结束日期**: 待定
- **持续时间**: 待定

### 1.3 团队成员

| 角色 | 负责人 | 职责 |
|------|--------|------|
| @Frontend | 前端 | 全部6个任务实现（T-801 ~ T-806） |
| @QA | 测试 | 最终验证 + `pnpm ts-check` 通过 |

> **注**: 本冲刺无架构变更，无需 @Architect 前置确认。数据全部从现有 API/Store 读取，不涉及后端改动。若实现中发现架构级问题，@Frontend 即时上报。

---

## 2. 前置条件

### 2.1 Sprint 7 关闭说明

Sprint 7（体验优化 · 第二阶段）于 2026-05-10 关闭。

| 状态 | 任务 | 优先级 | 说明 |
|------|------|:------:|------|
| ✅ QA通过 | T-701 | P0 | SessionCard 展开态添加"编辑"和"删除"按钮 |
| ✅ QA通过 | T-702 | P0 | "从上赛季导入玩家列表"功能（原阻塞，已于 Sprint 7 内补完） |
| ✅ QA通过 | T-703 | P1 | 手机端排行榜/数据表滚动指示器 |
| ✅ QA通过 | T-704 | P1 | "新建场次"按钮固定显示，不依赖状态显隐 |
| ✅ QA通过 | T-705 | P2 | 快捷选人面板（点击头像添加单行）替代一键添加全部 |

**Sprint 7 QA 验证结果**: T-701/T-703/T-704/T-705 首轮验证通过，T-702 首轮验证阻塞（未实现），后由 @Frontend 补完并通过复验。5项验收全部通过，类型检查零错误。

**Sprint 7 额外完成**: 赛季结束盘点检查功能（end-season-dialog.tsx 三步骤流程：盘点清单 → 清分摘要 → 最终确认）已实现并验证通过。

**遗留挂起任务（与本冲刺无关）**:

| 状态 | 任务 | 来源 | 说明 |
|------|------|------|------|
| ⏸️ 挂起 | T-403 | Sprint 4 | API路由改造（AI配置） |
| ⏸️ 挂起 | T-404 | Sprint 4 | AI配置最终验证 |
| ⏸️ 挂起 | T-101 | Sprint 2 | 腾讯文档集成 |
| ⏸️ 挂起 | T-102 | Sprint 2 | page.tsx 拆分 |
| ⏸️ 挂起 | T-103 | Sprint 2 | ESLint修复 |

### 2.2 Sprint 8 架构确认

**内容**:
- 本冲刺所有任务（T-801 ~ T-806）均为纯前端改动
- T-801 新建 `src/app/season-report/page.tsx` 独立页面路由，数据通过 Zustand Store 读取
- 底部导航增加"赛季报告"入口，链接到 `/season-report` 路由
- T-804 使用现有 Recharts 库，无需引入新依赖
- T-805 复用现有 `AwardsPage` 的数据逻辑和组件
- T-806 复用现有 `computeSeasonComparison` 函数（`stats-service.ts`）

**确认结果**: ✅ 无需架构前置确认，@Frontend 可直接开始执行

---

## 3. 任务看板

### 3.1 待办任务（TODO）

| ID | 任务名称 | 优先级 | 负责人 | 估计工时 | 依赖 | 标签 |
|----|----------|:------:|--------|:--------:|:----:|------|
| T-801 | 赛季总结报告页面框架 — 新建独立页面，顶部导航入口 | P0 | @Frontend | 2h | 无 | `page` `navigation` |
| T-802 | 赛季数据看板 — 总场次/总人数/场均积分/最大赢家/最大输家/总积分流动 | P0 | @Frontend | 3h | T-801 | `dashboard` |
| T-803 | 大事记列表 — 最大单场盈利/最长连胜/最大逆转/最活跃玩家等 | P0 | @Frontend | 3h | T-801 | `highlights` |
| T-804 | 积分走势图表 — 赛季内所有玩家积分变化叠加折线图 | P1 | @Frontend | 3h | T-801 | `chart` `recharts` |
| T-805 | 赛季颁奖 — 复用现有 AwardsPage 数据，展示获奖名单 | P1 | @Frontend | 2h | T-801 | `awards` |
| T-806 | 赛季对比 — 与上一赛季关键指标对比（参与人数/场均/总积分） | P2 | @Frontend | 3h | T-801 | `comparison` |

**工时汇总**: P0 = 8h / P1 = 5h / P2 = 3h / **总计 = 16h**

> **说明**: T-801 为基础依赖，其余任务须在 T-801 完成后开始。T-802~T-806 无相互依赖，可并行开发。

### 3.2 进行中任务（IN PROGRESS）

| ID | 任务名称 | 优先级 | 负责人 | 开始时间 | 进度 |
|----|----------|:------:|--------|----------|:----:|
| (暂无) | - | - | - | - | - |

### 3.3 已完成任务（DONE）

| ID | 任务名称 | 优先级 | 负责人 | 完成时间 | 结果 |
|----|----------|:------:|--------|----------|:----:|
| T001-T008 | Phase 0 基础架构重构 | P0 | @Backend | 2026-04-26 | ✅ 完成 |
| T013-T025 | Phase 1 P0核心功能 | P0 | @Backend/@Frontend | 2026-04-26 | ✅ 完成 |
| T027-T038 | Phase 2 P1增强功能 | P1 | @Backend/@Frontend | 2026-04-26 | ✅ 完成 |
| Task 1-8 | 快速手牌录入功能 | P1 | @Backend/@Frontend | 2026-05-05 | ✅ 完成 |
| TBD-01~10 | Sprint 1 文档体系与验收 | P0 | 全体 | 2026-05-05 | ✅ 完成 |
| T-401 | 创建 AI 配置 Store（Zustand + persist） | P0 | @Frontend | 2026-05-05 | ✅ 完成 |
| T-402 | 创建 AI 配置 Dialog 组件（"我的"Tab下） | P0 | @Frontend | 2026-05-05 | ✅ 完成 |
| T-501 | 快捷玩家栏 — 可点击标签组 | P0 | @Frontend | 2026-05-05 | ✅ 完成 |
| T-502 | 积分快捷按钮组 — 每行内嵌快捷按钮 | P0 | @Frontend | 2026-05-05 | ✅ 完成 |
| T-503 | 合计栏 sticky 固定 | P0 | @Frontend | 2026-05-05 | ✅ 完成 |
| T-504 | 表格实时自动排序 + 排名列（🥇🥈🥉） | P1 | @Frontend | 2026-05-05 | ✅ 完成 |
| T-505 | 移动端布局适配 | P1 | @Frontend | 2026-05-05 | ✅ 完成 |
| T-506 | 战报预览卡片替代 AlertDialog | P1 | @Frontend | 2026-05-05 | ✅ 完成 |
| **T-601** | 手牌页面"补全"按钮预填已有数据 | P0 | @Frontend | 2026-05-05 | ✅ 完成 |
| **T-602** | 手牌页面已保存手牌持久化（API双写） | P0 | @Frontend | 2026-05-05 | ✅ 完成 |
| **T-603** | 全站 ErrorBoundary 全局兜底 | P0 | @Frontend | 2026-05-05 | ✅ 完成 |
| **T-604** | 录入页 SessionList 传真实 sessions | P0 | @Frontend | 2026-05-05 | ✅ 完成 |
| **T-605** | 全站骨架屏组件化替代"加载中..."文本 | P1 | @Frontend | 2026-05-05 | ✅ 完成 |
| **T-606** | 排行页前3名样式统一 + 进度条自适应 | P1 | @Frontend | 2026-05-05 | ✅ 完成 |
| **T-607** | 录入页填分完成自动聚焦下一空行 | P1 | @Frontend | 2026-05-05 | ✅ 完成 |
| **T-608** | 个人中心 hydration修复 + 导入硬刷新改软刷新 | P1 | @Frontend | 2026-05-05 | ✅ 完成 |
| **T-701** | SessionCard 展开态添加"编辑"和"删除"按钮 | P0 | @Frontend | 2026-05-06 | ✅ QA通过 |
| **T-702** | "从上赛季导入玩家列表"功能 | P0 | @Frontend | 2026-05-06 | ✅ QA通过 |
| **T-703** | 手机端排行榜/数据表滚动指示器 | P1 | @Frontend | 2026-05-06 | ✅ QA通过 |
| **T-704** | "新建场次"按钮固定显示，不依赖状态显隐 | P1 | @Frontend | 2026-05-06 | ✅ QA通过 |
| **T-705** | 快捷选人面板（点击头像添加单行）替代一键添加全部 | P2 | @Frontend | 2026-05-06 | ✅ QA通过 |
| **T-801** | 赛季总结报告页面框架 | P0 | @Frontend | 2026-06-17 | ✅ 完成 |
| **T-802** | 赛季数据看板 | P0 | @Frontend | 2026-06-17 | ✅ 完成 |
| **T-803** | 大事记列表 | P0 | @Frontend | 2026-06-17 | ✅ 完成 |
| **T-804** | 积分走势图表 | P1 | @Frontend | 2026-06-17 | ✅ 完成 |
| **T-805** | 赛季颁奖 | P1 | @Frontend | 2026-06-17 | ✅ 完成 |
| **T-806** | 赛季对比 | P2 | @Frontend | 2026-06-17 | ✅ 完成 |

---

## 4. 冲刺进度

### 4.1 总体进度

```
████████████████████████████████████████   0%

待开始：6 个任务（本冲刺）
进行中：0 个任务
已完成：0 个任务（本冲刺）

**Sprint 7 最终验证**: 类型检查零错误，5项验收项全部通过（含T-702补完）
```

### 4.2 本周目标

- [ ] T-801 赛季总结报告页面框架
- [ ] T-802 赛季数据看板
- [ ] T-803 大事记列表
- [ ] T-804 积分走势图表
- [ ] T-805 赛季颁奖
- [ ] T-806 赛季对比

---

## 5. 障碍与风险

### 5.1 当前障碍

| 障碍 | 影响 | 状态 | 解决方案 |
|------|------|:----:|----------|
| (暂无) | - | ✅ 无 | - |

### 5.2 风险项

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:----:|:----:|----------|
| **T-801 独立路由与 SPA 架构冲突**：当前为单页 Tab 应用，新增 `/season-report` 路由需确认导航一致性 | 低 | 中 | 底部导航使用 `<a>` 标签或 `next/navigation` 的 `useRouter`，保留 Tab 状态不影响 |
| **T-802 数据源**：Zustand Store 数据在独立页面路由中是否能正常获取 | 低 | 中 | 确认 Store persist 数据在跨路由时可用；若不可用则 fallback 到 `lib/data.ts` 的 fetch 函数 |
| **T-804 图表渲染**：Recharts 在未安装或版本不兼容时需额外处理 | 低 | 低 | 确认 `package.json` 中已有 Recharts 依赖；若无则需安装 `recharts` |
| **T-806 赛季对比数据**：若只有1个赛季，对比功能应隐藏或提示"暂无历史赛季" | 低 | 低 | 判断 seasons.length < 2 时隐藏对比区域，显示提示文本 |

---

## 6. 会议记录

### 6.1 2026-05-10 Sprint 7 关闭 + Sprint 8 启动会

**议题**: 关闭 Sprint 7（体验优化 · 第二阶段），启动 Sprint 8（赛季总结报告）

**背景**:
- Sprint 7 全部5个任务（T-701 ~ T-705）已完成并通过 QA 验证
  - T-702 首轮审核时因未实现被标记为 ❌ 阻塞，后由 @Frontend 补完并通过 @QA 复验
- 赛季结束盘点检查功能（end-season-dialog.tsx）已同步实现并验证通过
- 用户提出新需求：生成**赛季总结报告**，以独立页面展示图表、数据和大事记

**决议**:
1. Sprint 7 关闭，所有5个任务标记完成
2. Sprint 8 聚焦"赛季总结报告"，共6个任务（T-801 ~ T-806），分 P0/P1/P2 三级
3. T-801 基础页面框架为前置依赖，其余任务可并行
4. 新页面放在 `src/app/season-report/page.tsx` 路由下
5. 底部导航增加"赛季报告"入口
6. 所有数据从现有 API/Store 读取，纯前端改动
7. 约束：不改后端/数据库，不更新 api-contracts.md，所有改动需通过 `pnpm ts-check`
8. T-804 图表使用现有 Recharts 库，不引入新依赖
9. Sprint 4 及更早 Sprint 挂起任务（T-403/T-404/T-101/T-102/T-103）继续保持 ⏸️ 挂起

**行动项**:
- @Frontend: 按 T-801 → (T-802~T-806 并行) 顺序实现 Sprint 8 任务
- @QA: 准备验证清单，待所有任务完成后执行最终验证 + `pnpm ts-check`

### 6.2 Sprint 7 遗留 Minor 建议跟踪

| 编号 | 来源 | 描述 | 本次 Sprint 覆盖情况 |
|------|------|------|---------------------|
| ⓘ-2 | T-502/S5 | 快捷按钮颜色未用绿色/红色区分 | ❌ 未覆盖，待后续 Sprint |
| ⓘ-3 | T-505/S5 | 删除按钮尺寸不满足 44x44px | ❌ 未覆盖，待后续 Sprint |

---

## 7. 交付物

### 7.1 本冲刺交付物（规划中）

| 交付物 | 负责人 | 状态 | 位置 |
|--------|--------|:----:|------|
| 赛季总结报告页面框架 | @Frontend | ⏳ 待开始 | `src/app/season-report/page.tsx` |
| 赛季数据看板组件 | @Frontend | ⏳ 待开始 | `src/components/poker/season-report/` 目录 |
| 大事记组件 | @Frontend | ⏳ 待开始 | `src/components/poker/season-report/` 目录 |
| 积分走势图表组件 | @Frontend | ⏳ 待开始 | `src/components/poker/season-report/` 目录 |
| 赛季颁奖组件 | @Frontend | ⏳ 待开始 | `src/components/poker/season-report/` 目录 |
| 赛季对比组件 | @Frontend | ⏳ 待开始 | `src/components/poker/season-report/` 目录 |

---

## 8. 任务详情

### T-801: 赛季总结报告页面框架

**优先级**: P0 | **工时**: 2h | **负责人**: @Frontend

**说明**:
- 新建 `src/app/season-report/page.tsx` 独立页面路由
- 页面为服务端组件壳（Server Component），内部渲染客户端组件 `SeasonReportClient`
- 底部导航栏增加"赛季报告"入口，使用 `<a>` 标签或 `next/link` 链接到 `/season-report`
- 页面顶部显示回退按钮（← 返回主页）和页面标题"赛季总结报告"
- 页面从 Zustand Store 读取赛季数据（seasonStore）、比赛记录（recordStore）、结算记录（settlementStore）
- 若无活跃赛季但有关闭的赛季，默认显示最近一个已关闭赛季的数据

**涉及文件**:
- `src/app/season-report/page.tsx`（新建）
- `src/components/poker/season-report/season-report-client.tsx`（新建，客户端组件入口）
- `src/app/page.tsx`（底部导航增加"赛季报告"入口）

**数据源**:
- `seasonStore` → 获取所有赛季列表和活跃赛季
- `recordStore` → 获取记录数据，按赛季过滤
- `settlementStore` → 获取结算数据

**验收标准**:
- [ ] `/season-report` 页面可独立访问，显示"赛季总结报告"标题
- [ ] 底部导航栏有"赛季报告"入口，点击可跳转
- [ ] 页面有返回按钮，点击回到主页
- [ ] 页面正确读取并展示赛季筛选器（可选择不同赛季查看报告）
- [ ] 无数据时显示友好空态提示
- [ ] `pnpm ts-check` 零错误

---

### T-802: 赛季数据看板

**优先级**: P0 | **工时**: 3h | **负责人**: @Frontend

**说明**:
- 在赛季总结报告页面中展示数据看板区域
- 使用卡片网格布局，展示以下指标：
  - **总场次**: 赛季总比赛场次数
  - **参与人数**: 赛季中至少打过1场的玩家数
  - **场均积分**: 总积分 / 总场次（保留整数）
  - **总积分流动**: 胜方总分 + 负方总分绝对值
  - **最大赢家**: 赛季总积分最高的玩家 + 积分值
  - **最大输家**: 赛季总积分最低的玩家 + 积分值
- 数据从 `ComputedStats`（`lib/stats.ts` 的 `computeStats` 返回值）中读取
- 卡片使用 shadcn/ui Card 组件，每个指标带对应图标

**涉及文件**:
- `src/components/poker/season-report/stats-dashboard.tsx`（新建）
- `src/components/poker/season-report/season-report-client.tsx`（引用）

**数据源**:
- `computeStats(filteredRecords)` → `players[].total`, `totalGames`, `totalRecords`

**验收标准**:
- [ ] 显示所有6项指标，数据准确
- [ ] 最大赢家/最大输家高亮显示（绿色/红色）
- [ ] 数据格式正确（数字千分位、百分比等）
- [ ] 移动端自适应两列布局
- [ ] `pnpm ts-check` 零错误

---

### T-803: 大事记列表

**优先级**: P0 | **工时**: 3h | **负责人**: @Frontend

**说明**:
- 在赛季总结报告页面中展示大事记列表区域
- 从 `ComputedStats` 和记录数据中提取以下大事记：
  - **最大单场盈利**: 单场积分最高的玩家 + 日期 + 金额
  - **最长连胜**: 连胜场次最多的玩家 + 连胜次数
  - **最大逆转**: 单场最大亏损（最低分）的玩家 + 日期 + 金额
  - **最活跃玩家**: 参赛场次最多的玩家 + 场次数
  - **最多冠军**: 单场获胜次数最多的玩家（单场积分>0的次数）
  - **清分王**: 赛季内请吃饭次数最多的玩家
- 每个大事记使用卡片布局，带图标和描述文字
- 按重要性排序（最大盈利 > 最长连胜 > 最大逆转 > 最活跃 > 最多冠军 > 清分王）

**涉及文件**:
- `src/components/poker/season-report/highlights-list.tsx`（新建）
- `src/components/poker/season-report/season-report-client.tsx`（引用）

**数据源**:
- `computeStats(filteredRecords)` → `players[].maxWin`, `players[].maxLoss`, `players[].longestWinStreak`, `players[].sessionCount`, `players[].wins`
- `dailyBests` → 最大单场盈利详情
- `settlements` → 清分数据

**验收标准**:
- [ ] 显示所有6项大事记，数据准确
- [ ] 每条大事记有清晰的标题、数值和玩家名
- [ ] 空数据时显示友好的提示文本
- [ ] 移动端单列布局
- [ ] `pnpm ts-check` 零错误

---

### T-804: 积分走势图表

**优先级**: P1 | **工时**: 3h | **负责人**: @Frontend

**说明**:
- 在赛季总结报告页面中展示积分走势图表区域
- 使用 Recharts 的 `LineChart` 组件
- X轴：日期（"MM-DD"格式）
- Y轴：累计积分
- 每条线代表一个玩家，不同颜色区分
- 图表自动缩放以适应数据范围
- 图例显示所有玩家名，可点击隐藏/显示特定玩家的线
- 鼠标悬停时显示 Tooltip（玩家名 + 当日累计积分）
- 最多显示10个玩家线，超出时在图表下方显示"仅显示前10名"提示

**涉及文件**:
- `src/components/poker/season-report/trend-chart.tsx`（新建）
- `src/components/poker/season-report/season-report-client.tsx`（引用）

**数据源**:
- `computeStats(filteredRecords)` → `trendData`（`TrendPoint[]`）和 `cumulative`

**验收标准**:
- [ ] 折线图正确显示赛季内积分变化趋势
- [ ] 不同玩家用不同颜色区分
- [ ] 图例可交互（点击隐藏/显示）
- [ ] Tooltip 显示玩家名和积分
- [ ] 最多显示10个玩家，超出有提示
- [ ] 移动端自适应宽度
- [ ] `pnpm ts-check` 零错误

---

### T-805: 赛季颁奖

**优先级**: P1 | **工时**: 2h | **负责人**: @Frontend

**说明**:
- 在赛季总结报告页面中展示赛季颁奖区域
- 复用现有 `AwardsPage` 的数据逻辑
- 从 `awardRecords` API 或 `awardService` 获取赛季奖项数据
- 若无奖项记录，使用 `computeAwards` 函数（`award-service.ts`）基于赛季数据计算默认奖项
- 奖项以列表形式展示：图标 + 奖项名 + 获奖玩家
- 奖项示例：MVP、最佳进攻、最佳防守、最活跃、清分王、进步最快等

**涉及文件**:
- `src/components/poker/season-report/season-awards.tsx`（新建）
- `src/components/poker/season-report/season-report-client.tsx`（引用）

**数据源**:
- API `/api/awards` → 获取本赛季奖项记录
- `awardService.computeAwards` → 若无记录则计算默认奖项

**验收标准**:
- [ ] 展示赛季奖项列表，每项含图标、奖项名和获奖玩家
- [ ] 数据来源优先从 API 读取奖项记录，无记录则自动计算
- [ ] 与现有 `AwardsPage` 数据一致
- [ ] 无奖项数据时显示"暂无奖项"提示
- [ ] `pnpm ts-check` 零错误

---

### T-806: 赛季对比

**优先级**: P2 | **工时**: 3h | **负责人**: @Frontend

**说明**:
- 在赛季总结报告页面中展示赛季对比区域
- 与上一赛季进行关键指标对比：
  - **参与人数**: 本赛季 vs 上一赛季 + 增减
  - **总场次**: 本赛季 vs 上一赛季 + 增减
  - **场均积分**: 本赛季 vs 上一赛季 + 增减
  - **总积分流动**: 本赛季 vs 上一赛季 + 增减
- 使用 `computeSeasonComparison` 函数（`stats-service.ts`）获取对比数据
- 使用左右对比布局或表格展示
- 若只有1个赛季，隐藏对比区域，显示"暂无历史赛季数据"提示
- 变化值用绿色（增长）/ 红色（下降）/ 灰色（持平）显示

**涉及文件**:
- `src/components/poker/season-report/season-comparison.tsx`（新建）
- `src/components/poker/season-report/season-report-client.tsx`（引用）

**数据源**:
- `computeSeasonComparison(season1Records, season2Records)`（`stats-service.ts`）

**验收标准**:
- [ ] 显示4项对比指标，数据准确
- [ ] 变化值用不同颜色标识（增长/下降/持平）
- [ ] 只有1个赛季时隐藏对比区域并提示
- [ ] 移动端堆叠布局显示
- [ ] `pnpm ts-check` 零错误

---

## 9. 依赖关系图

```
T-801（页面框架）是唯一前置依赖，其余任务在 T-801 完成后可并行。

执行顺序:

  Step 1: T-801 页面框架（2h）
  ┌──────────────────────────────────────────────────────────┐
  │  src/app/season-report/page.tsx                          │
  │  src/components/poker/season-report/season-report-client.tsx  │
  │  src/app/page.tsx（底部导航 + 赛季报告入口）            │
  └──────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
  │   P0 区域     │ │   P1 区域     │ │   P2 区域     │
  │               │ │               │ │               │
  │  T-802 数据   │ │  T-804 图表   │ │  T-806 赛季   │
  │  看板 (3h)    │ │  (3h)         │ │  对比 (3h)    │
  │               │ │               │ │               │
  │  T-803 大事记 │ │  T-805 颁奖   │ │               │
  │  列表 (3h)    │ │  (2h)         │ │               │
  └───────────────┘ └───────────────┘ └───────────────┘
                            │
                            ▼
                   @QA 最终验证
               (pnpm ts-check + 功能验收)
```

> **说明**: T-802~T-806 任务改动文件不重叠（各自独立组件），技术上完全可并行。

---

## 10. 注释

1. **纯前端约束**: 本冲刺所有任务严格限定为纯前端改动，不改后端 API、不更新 `api-contracts.md`、不修改数据库 Schema。
2. **独立页面路由**: 当前项目为 SPA Tab 架构，新增 `/season-report` 独立路由。底部导航使用 `<a>` 标签或 `Link` 组件实现跳转。Zustand Store 的 persist 确保跨路由数据可用。
3. **T-804 Recharts**: 确认 `package.json` 中已包含 `recharts` 依赖。若未安装，@Frontend 需执行 `pnpm add recharts`。
4. **T-805 奖项数据**: 优先从 API 读取；若 API 无数据或可用时，使用 `awardService.computeAwards` 计算。复用但不直接依赖 `AwardsPage` 组件代码，抽取公共逻辑即可。
5. **T-806 对比函数**: `computeSeasonComparison` 已在 `stats-service.ts` 中实现，直接调用。仅对比最近两个赛季。
6. **复用 `computeStats`**: 数据看板、大事记、图表均依赖 `computeStats`，建议在 `SeasonReportClient` 中统一计算一次后通过 props 下发各子组件。
7. **遗留 Minor 建议**: ⓘ-2（快捷按钮颜色）和 ⓘ-3（删除按钮尺寸）继续待后续 Sprint。

---

## 11. 任务领取状态

| 任务 | 状态 | 领取人 | 开始时间 | 预计完成 |
|------|:----:|--------|----------|----------|
| T-801 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |
| T-802 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |
| T-803 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |
| T-804 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |
| T-805 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |
| T-806 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |

---

## 12. 版本历史

| 版本 | 日期 | 变更内容 | 变更人 |
|:----:|:----:|----------|:------:|
| **8.0** | **2026-05-10** | **Sprint 8 正式启动：赛季总结报告，6个任务（T-801~T-806），P0数据看板+大事记+P1图表+颁奖+P2赛季对比。Sprint 7 关闭，全部5个任务（T-701~T-705）通过 QA 验证。赛季结束盘点检查功能同步实现。** | **@PM** |
| 7.0 | 2026-05-06 | Sprint 7 正式启动：体验优化 · 第二阶段，5个任务（T-701~T-705），P0体验阻断 + P1体验优化 + P2可优化。Sprint 6 关闭，全部8个任务（T-601~T-608）通过 QA 验证。 | @PM |
| 6.2 | 2026-05-05 | ✅ @QA 最终验证通过：类型检查零错误，25项验收项全部通过。T-601~T-608 全部完成。handover.md 已更新。 | @QA |
| 6.1 | 2026-05-05 | T-601/T-602 ✅ 完成：手牌补全预填 + 已保存手牌持久化。修改 hand-page.tsx：新增 parseHandRecordToWizardData、loadSavedHands、localStorage 降级。pnpm ts-check 零错误。 | @Frontend |
| 6.0 | 2026-05-05 | Sprint 6 正式启动：整体前端重构，8个任务（T-601~T-608），P0体验阻断 + P1体验优化。Sprint 5 关闭，全部6个任务验收通过。 | @PM |
| 5.1 | 2026-05-05 | Sprint 5 全部完成：T-501~T-506 通过 @QA 最终验证。录入积分界面优化（快捷玩家栏/积分快捷按钮/sticky合计栏/排序排名/移动端适配/战报卡片）。3个Minor建议已记录 | @QA |
| 5.0 | 2026-05-05 | Sprint 5 正式启动：录入积分界面优化，6个任务（T-501~T-506），分3个Phase。Sprint 4 关闭，T-403/T-404 挂起。 | @PM |
| 4.0 | 2026-05-05 | Sprint 4 启动：AI配置功能，T-401~T-404。 | @PM |

---

# 当前冲刺 · Poker Tracker — Sprint 9

**冲刺名称**: Sprint 9 - 德扑教练功能 MVP（Phase 1）
**版本**: 9.0
**日期**: 2026-06-03
**状态**: 规划中
**管理者**: @PM

> **前置说明**: Sprint 8（赛季总结报告）尚未关闭。Sprint 9 为独立新功能 Sprint，与 Sprint 8 无依赖关系，可并行规划。

---

## 1. 冲刺概述

### 1.1 冲刺目标

实现**德扑教练功能 MVP**，包含核心训练模块和基础教练模块。用户可在模拟 Cash Game 桌面上打牌，获得 Preflop GTO 建议和胜率计算，训练记录持久化保存。

### 1.2 范围定义

**P0 — 核心功能（必须完成）**
- T-901: 数据库 Schema 变更 — 新增 coach_sessions + coach_decisions + coach_feedback 表
- T-902: 赔率计算引擎 — 集成 poker-odds-calculator，实现 Equity/Pot Odds/EV 计算
- T-903: Preflop GTO 范围表 — 预计算 JSON + 查询逻辑（6-max Cash Game）
- T-904: 训练会话 API — 会话 CRUD + 决策记录 API
- T-905: 训练桌面 UI — 牌面区域 + 操作按钮 + 底池 + 胜率显示
- T-906: AI 对手引擎 — GTO 策略对手，自动响应决策
- T-907: 教练中心页面 — 训练历史列表 + 快捷开始训练

**P1 — 增强功能（建议完成）**
- T-908: GTO 纠偏反馈 — 用户决策后对比 GTO 建议，输出偏差分析
- T-909: Postflop 简化策略 — Flop/Turn/River 基础 GTO 建议

**P2 — 扩展功能（选做）**
- T-910: 训练设置对话框 — 起始筹码/盲注/对手风格配置
- T-911: 复盘页面基础版 — 决策统计 + 关键决策点列表

### 1.3 时间范围

- **开始日期**: 待定
- **结束日期**: 待定
- **持续时间**: 待定

### 1.4 团队成员

| 角色 | 负责人 | 职责 |
|------|--------|------|
| @Architect | 架构 | 数据库 Schema 设计、核心引擎设计、API 契约 |
| @Backend | 后端 | T-901 Schema + T-902 赔率引擎 + T-903 GTO 范围表 + T-904 API |
| @Frontend | 前端 | T-905 训练桌面 UI + T-907 教练中心 + T-910 设置对话框 + T-911 复盘 |
| @QA | 测试 | 全量功能验证 + `pnpm ts-check` 通过 |

> **注**: T-906（AI 对手引擎）涉及后端引擎 + 前端交互，需 @Backend 和 @Frontend 协作。T-908/T-909 依赖 T-902/T-903 完成后开始。

---

## 2. 前置条件

### 2.1 Sprint 8 状态

Sprint 8（赛季总结报告）当前为进行中状态，6 个任务（T-801 ~ T-806）尚未开始执行。Sprint 9 与 Sprint 8 无代码依赖关系，可独立规划。

### 2.2 技术调研结论

**MVP 技术方案**（已由 technical-researcher 完成调研）：
- 赔率计算：使用 `poker-odds-calculator` npm 包
- 手牌价值评估：使用 `bitval` npm 包
- Preflop GTO 范围：预计算 JSON 文件 + 运行时内存查询
- Postflop 策略：基于手牌强度分级的启发式规则（简化 GTO）
- 对手 AI：基于 GTO 范围表 + 随机化决策

**需引入的新依赖**：
- `poker-odds-calculator` — [HUMAN-REVIEW:NEW-DEPENDENCY]
- `bitval` — [HUMAN-REVIEW:NEW-DEPENDENCY]

### 2.3 架构确认

**待 @Architect 确认**：
- [ ] 数据库 Schema 设计（3 张新表）
- [ ] 核心引擎接口定义（赔率计算 / GTO 查询 / 对手决策）
- [ ] API 契约（训练会话 CRUD / 决策记录 / GTO 建议）
- [ ] 前端路由设计（`/coach` + `/coach/training` + `/coach/review/:sessionId`）
- [ ] 组件树和 Store 设计

---

## 3. 任务看板

### 3.1 待办任务（TODO）

| ID | 任务名称 | 优先级 | 负责人 | 估计工时 | 依赖 | 标签 |
|----|----------|:------:|--------|:--------:|:----:|------|
| T-901 | 数据库 Schema 变更 — 新增 coach_sessions / coach_decisions / coach_feedback 表 + relations | P0 | @Backend | 2h | 无 | `schema` `db` |
| T-902 | 赔率计算引擎 — 集成 poker-odds-calculator，实现 calculateEquity / calculatePotOdds / calculateEV | P0 | @Backend | 3h | 无 | `engine` `poker` |
| T-903 | Preflop GTO 范围表 — 生成 preflop-ranges.json + getPreflopAdvice 查询函数 | P0 | @Backend | 4h | 无 | `engine` `gto` |
| T-904 | 训练会话 API — POST/GET/PATCH/DELETE /api/coach/sessions + POST /api/coach/sessions/:id/decisions | P0 | @Backend | 4h | T-901 | `api` |
| T-905 | 训练桌面 UI — board-area / hole-cards / action-buttons / raise-slider / pot-display / equity-display | P0 | @Frontend | 8h | T-904 | `ui` `training` |
| T-906 | AI 对手引擎 — 基于 GTO 范围表 + Postflop 简化策略的对手决策逻辑 | P0 | @Backend | 4h | T-902, T-903 | `engine` `ai` |
| T-907 | 教练中心页面 — /coach 路由 + 训练历史列表 + 快捷开始训练 | P0 | @Frontend | 3h | T-904, T-905 | `ui` `page` |
| T-908 | GTO 纠偏反馈 — 决策对比 + 偏差分析 + 反馈消息生成 | P1 | @Backend | 4h | T-902, T-903 | `engine` `feedback` |
| T-909 | Postflop 简化策略 — Flop/Turn/River 手牌强度分级 + 建议规则 | P1 | @Backend | 6h | T-902 | `engine` `gto` |
| T-910 | 训练设置对话框 — 起始筹码/盲注/对手风格配置 | P2 | @Frontend | 2h | T-905 | `ui` `settings` |
| T-911 | 复盘页面基础版 — /coach/review/:sessionId + 决策统计 + 关键决策点 | P2 | @Frontend | 4h | T-904, T-905 | `ui` `review` |

**工时汇总**: P0 = 24h / P1 = 10h / P2 = 6h / **总计 = 40h**

> **说明**: T-901/T-902/T-903 无依赖可并行开始。T-904 依赖 T-901，T-906 依赖 T-902+T-903，T-905/T-907 依赖 T-904。T-908 依赖 T-902+T-903。T-909 依赖 T-902。

### 3.2 进行中任务（IN PROGRESS）

| ID | 任务名称 | 优先级 | 负责人 | 开始时间 | 进度 |
|----|----------|:------:|--------|----------|:----:|
| (暂无) | - | - | - | - | - |

### 3.3 已完成任务（DONE）

| ID | 任务名称 | 优先级 | 负责人 | 完成时间 | 结果 |
|----|----------|:------:|--------|----------|:----:|
| (暂无) | - | - | - | - | - |

---

## 4. 冲刺进度

### 4.1 总体进度

```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%

待开始：11 个任务（本冲刺）
进行中：0 个任务
已完成：0 个任务（本冲刺）
```

### 4.2 本周目标

- [ ] @Architect 完成架构确认（Schema / 引擎接口 / API 契约）
- [ ] @Backend 启动 T-901 / T-902 / T-903（无依赖任务）
- [ ] @Frontend 等待 API 契约确定后启动 T-905

---

## 5. 障碍与风险

### 5.1 当前障碍

| 障碍 | 影响 | 状态 | 解决方案 |
|------|------|:----:|----------|
| 待 @Architect 架构确认 | 阻塞所有任务 | ⏳ 待解决 | 启动 Sprint 前完成架构评审 |

### 5.2 风险项

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:----:|:----:|----------|
| **poker-odds-calculator 集成复杂度**：npm 包的 API 兼容性和计算精度不确定 | 中 | 高 | 先在独立测试文件中验证 API，确认可行后再集成到引擎 |
| **Preflop GTO 范围数据准确性**：预计算范围表可能偏离真实 GTO | 中 | 中 | 参考多个公开来源（GTO Wizard / PokerSnowie），使用 bitval 交叉验证 |
| **训练桌面 UI 复杂度**：牌面渲染 + 动画 + 操作交互复杂度高 | 中 | 高 | 先实现无动画的静态版本，Phase 2 再添加过渡动画 |
| **Sprint 8 未关闭**：若 Sprint 8 任务延后，可能影响 Sprint 9 资源分配 | 低 | 中 | Sprint 8 和 Sprint 9 无代码依赖，可并行推进 |
| **新依赖安全风险**：引入 2 个新 npm 包 | 低 | 中 | 使用 `pnpm audit` 检查，选择维护活跃的版本 |

---

## 6. 会议记录

### 6.1 2026-06-03 Sprint 9 规划会

**议题**: 启动 Sprint 9（德扑教练功能 MVP）

**背景**:
- 技术调研已完成，确认 MVP 方案：`poker-odds-calculator` + `bitval` + 预计算 GTO 范围表
- PRD 已输出到 `.trae/specs/poker-coach-prd.md`
- Sprint 8（赛季总结报告）尚未关闭，但无代码依赖冲突

**决议**:
1. Sprint 9 聚焦德扑教练 MVP，共 11 个任务（T-901 ~ T-911），分 P0/P1/P2 三级
2. T-901/T-902/T-903 为无依赖任务，可并行启动
3. 新依赖引入需 [HUMAN-REVIEW:NEW-DEPENDENCY] 确认
4. 架构确认由 @Architect 在 Sprint 启动前完成
5. 训练桌面 UI 先实现静态版本，动画在 Phase 2 添加

**行动项**:
- @Architect: 完成 Schema / 引擎接口 / API 契约设计
- @Backend: 按 T-901 → (T-902+T-903 并行) → T-904 → T-906 → T-908+T-909 顺序执行
- @Frontend: 等待 API 契约后，按 T-905 → T-907 → T-910+T-911 顺序执行
- @QA: 准备验收清单

---

## 7. 交付物

### 7.1 本冲刺交付物（规划中）

| 交付物 | 负责人 | 状态 | 位置 |
|--------|--------|:----:|------|
| 数据库 Schema 变更 | @Backend | ⏳ 待开始 | `src/storage/database/shared/schema.ts` |
| 赔率计算引擎 | @Backend | ⏳ 待开始 | `src/lib/coach/equity-engine.ts` |
| Preflop GTO 范围表 | @Backend | ⏳ 待开始 | `src/lib/coach/preflop-ranges.json` + `src/lib/coach/gto-engine.ts` |
| 训练会话 API | @Backend | ⏳ 待开始 | `src/app/api/coach/` |
| AI 对手引擎 | @Backend | ⏳ 待开始 | `src/lib/coach/opponent-engine.ts` |
| GTO 纠偏反馈 | @Backend | ⏳ 待开始 | `src/lib/coach/feedback-engine.ts` |
| Postflop 简化策略 | @Backend | ⏳ 待开始 | `src/lib/coach/postflop-strategy.ts` |
| 训练桌面 UI | @Frontend | ⏳ 待开始 | `src/components/poker/coach/` |
| 教练中心页面 | @Frontend | ⏳ 待开始 | `src/app/coach/` |
| 训练设置对话框 | @Frontend | ⏳ 待开始 | `src/components/poker/coach/training-settings.tsx` |
| 复盘页面 | @Frontend | ⏳ 待开始 | `src/app/coach/review/` |

---

## 8. 任务详情

### T-901: 数据库 Schema 变更

**优先级**: P0 | **工时**: 2h | **负责人**: @Backend

**说明**:
- 在 `src/storage/database/shared/schema.ts` 中新增 3 张表：
  - `coachSessions` — 训练会话表（mode, status, startingStack, blindSmall, blindBig, opponentStyle, totalHands, totalEv, completedAt）
  - `coachDecisions` — 决策记录表（sessionId FK, handNumber, street, holeCards, boardCards, potSize, userStack, opponentStack, userAction, userBetAmount, opponentAction, opponentBetAmount, gtoRecommendation, gtoFrequency, equity, potOdds, ev, isCorrect, deviation, result, netChips）
  - `coachFeedback` — 反馈记录表（sessionId FK, decisionId FK, feedbackType, message, suggestion）
- 在 `src/storage/database/shared/relations.ts` 中新增表关系定义
- 在 `src/lib/types.ts` 中新增对应 TypeScript 类型

**涉及文件**:
- `src/storage/database/shared/schema.ts`（修改）
- `src/storage/database/shared/relations.ts`（修改）
- `src/lib/types.ts`（修改）

**验收标准**:
- [ ] 3 张新表正确创建，字段类型和约束正确
- [ ] 外键关系正确（coachDecisions → coachSessions, coachFeedback → coachSessions + coachDecisions）
- [ ] 索引正确创建（sessionId、status 等查询字段）
- [ ] TypeScript 类型定义完整
- [ ] `pnpm ts-check` 零错误

---

### T-902: 赔率计算引擎

**优先级**: P0 | **工时**: 3h | **负责人**: @Backend

**说明**:
- 安装 `poker-odds-calculator` npm 包 [HUMAN-REVIEW:NEW-DEPENDENCY]
- 创建 `src/lib/coach/equity-engine.ts`
- 实现以下核心函数：
  - `calculateEquity(holeCards, boardCards, opponentRange?)` — 计算胜率
  - `calculatePotOdds(potSize, callAmount)` — 计算底池赔率
  - `calculateEV(equity, potSize, callAmount)` — 计算期望值
- 支持 Preflop/Flop/Turn/River 各阶段
- 封装统一错误处理

**涉及文件**:
- `src/lib/coach/equity-engine.ts`（新建）
- `package.json`（修改，新增依赖）

**验收标准**:
- [ ] `calculateEquity` 返回 { win, tie, equity } 正确
- [ ] Preflop AKs vs 随机手牌 equity ≈ 67%
- [ ] Flop 顶对 vs 随机手牌 equity 正确
- [ ] `calculatePotOdds` 计算正确
- [ ] `calculateEV` 计算正确
- [ ] 错误处理完善（无效牌面、空参数等）
- [ ] `pnpm ts-check` 零错误

---

### T-903: Preflop GTO 范围表

**优先级**: P0 | **工时**: 4h | **负责人**: @Backend

**说明**:
- 创建 `src/lib/coach/preflop-ranges.json` — 预计算 6-max Cash Game GTO 范围表
- 创建 `src/lib/coach/gto-engine.ts` — 范围表查询引擎
- 范围表结构：
  - 按位置（UTG/MP/CO/BTN/SB/BB）组织
  - 每个位置包含 169 种手牌组合的建议动作和频率
  - 手牌编码使用标准格式（AKs, AKo, TT, 72o 等）
- 使用 `bitval` 辅助生成范围表 [HUMAN-REVIEW:NEW-DEPENDENCY]
- 查询函数 `getPreflopAdvice(position, hand, tableSize)` 支持 6-max

**涉及文件**:
- `src/lib/coach/preflop-ranges.json`（新建）
- `src/lib/coach/gto-engine.ts`（新建）
- `src/lib/coach/preflop-ranges-generator.ts`（新建，生成脚本）

**验收标准**:
- [ ] preflop-ranges.json 包含 6 个位置的完整范围数据
- [ ] `getPreflopAdvice` 返回正确的建议动作和频率
- [ ] BTN 位 AKs 返回 raise（频率 ~85%）
- [ ] UTG 位 72o 返回 fold（频率 ~100%）
- [ ] 查询性能 < 50ms
- [ ] `pnpm ts-check` 零错误

---

### T-904: 训练会话 API

**优先级**: P0 | **工时**: 4h | **负责人**: @Backend

**说明**:
- 创建 `src/app/api/coach/sessions/route.ts` — 会话 CRUD
  - POST /api/coach/sessions — 创建会话
  - GET /api/coach/sessions — 列表（分页）
  - GET /api/coach/sessions/:id — 详情
  - PATCH /api/coach/sessions/:id — 更新状态
  - DELETE /api/coach/sessions/:id — 删除
- 创建 `src/app/api/coach/sessions/[id]/decisions/route.ts` — 决策记录
  - POST — 记录决策
  - GET — 获取会话所有决策
- 创建 `src/services/coach-service.ts` — 业务逻辑层
- 创建 `src/storage/database/crud/coach-crud.ts` — 数据访问层
- 创建 `src/stores/coach-store.ts` — Zustand Store（前端状态管理）
- 更新 `api-contracts.md`

**涉及文件**:
- `src/app/api/coach/sessions/route.ts`（新建）
- `src/app/api/coach/sessions/[id]/decisions/route.ts`（新建）
- `src/services/coach-service.ts`（新建）
- `src/storage/database/crud/coach-crud.ts`（新建）
- `src/stores/coach-store.ts`（新建）
- `.trae/memory/api-contracts.md`（更新）

**验收标准**:
- [ ] 创建会话返回正确的会话数据
- [ ] 会话列表支持分页
- [ ] 决策记录写入正确
- [ ] 会话状态更新正确（in_progress → completed / abandoned）
- [ ] 删除会话级联删除关联决策和反馈
- [ ] 错误处理完善
- [ ] `pnpm ts-check` 零错误

---

### T-905: 训练桌面 UI

**优先级**: P0 | **工时**: 8h | **负责人**: @Frontend

**说明**:
- 创建 `/coach/training` 页面路由
- 实现训练桌面核心组件：
  - `board-area.tsx` — 公共牌 5 张（Flop 3 + Turn 1 + River 1 逐步揭示）
  - `hole-cards.tsx` — 用户底牌 2 张（带花色图标）
  - `action-buttons.tsx` — Fold / Check / Call / Raise / All-in 按钮组
  - `raise-slider.tsx` — 加注金额滑块（Min Raise ~ All-in）
  - `pot-display.tsx` — 底池筹码显示
  - `equity-display.tsx` — 胜率 / 底池赔率 / EV 显示面板
  - `gto-advice-panel.tsx` — GTO 建议面板（显示推荐动作 + 频率）
  - `opponent-info.tsx` — 对手信息（筹码量 + 风格）
  - `hand-history.tsx` — 手牌历史侧边栏
- 实现 `coach-store.ts`（Zustand Store）管理训练状态
- 底部导航新增"教练"Tab

**涉及文件**:
- `src/app/coach/training/page.tsx`（新建）
- `src/components/poker/coach/training-table.tsx`（新建）
- `src/components/poker/coach/board-area.tsx`（新建）
- `src/components/poker/coach/hole-cards.tsx`（新建）
- `src/components/poker/coach/action-buttons.tsx`（新建）
- `src/components/poker/coach/raise-slider.tsx`（新建）
- `src/components/poker/coach/pot-display.tsx`（新建）
- `src/components/poker/coach/equity-display.tsx`（新建）
- `src/components/poker/coach/gto-advice-panel.tsx`（新建）
- `src/components/poker/coach/opponent-info.tsx`（新建）
- `src/components/poker/coach/hand-history.tsx`（新建）
- `src/stores/coach-store.ts`（新建）
- `src/app/page.tsx`（底部导航新增"教练"Tab）

**验收标准**:
- [ ] 训练桌面显示底牌（2张带花色）和公共牌区域
- [ ] 操作按钮组正确显示，Check/Call 根据场景动态切换
- [ ] Raise 滑块支持金额输入
- [ ] 底池显示实时更新
- [ ] 胜率/赔率/EV 面板显示正确
- [ ] GTO 建议面板显示推荐动作和频率
- [ ] 手牌历史侧边栏可展开/收起
- [ ] 底部导航有"教练"Tab
- [ ] 移动端适配
- [ ] `pnpm ts-check` 零错误

---

### T-906: AI 对手引擎

**优先级**: P0 | **工时**: 4h | **负责人**: @Backend

**说明**:
- 创建 `src/lib/coach/opponent-engine.ts`
- 实现对手决策逻辑：
  - Preflop：基于 GTO 范围表（T-903）按频率随机选择动作
  - Postflop：基于手牌强度 + 底池赔率 + 位置的简化规则
  - 支持 GTO 风格（默认）
- 对手决策接口：
  ```typescript
  function getOpponentDecision(
    street: Street,
    holeCards: string[],
    boardCards: string[],
    potSize: number,
    opponentStack: number,
    userAction: string,
    userBetAmount: number,
    style: OpponentStyle
  ): { action: string; betAmount: number }
  ```
- 集成到训练会话 API 的决策流程中

**涉及文件**:
- `src/lib/coach/opponent-engine.ts`（新建）
- `src/lib/coach/postflop-strategy.ts`（新建，Postflop 简化策略）
- `src/services/coach-service.ts`（修改，集成对手决策）

**验收标准**:
- [ ] Preflop 对手决策符合 GTO 范围表分布
- [ ] Postflop 对手决策合理（有牌加注/听牌跟注/垃圾弃牌）
- [ ] 对手筹码量变化正确
- [ ] 对手弃牌时用户赢得底池
- [ ] `pnpm ts-check` 零错误

---

### T-907: 教练中心页面

**优先级**: P0 | **工时**: 3h | **负责人**: @Frontend

**说明**:
- 创建 `/coach` 页面路由（教练中心首页）
- 实现以下区域：
  - **快捷开始**：大按钮"开始训练"，点击进入训练设置
  - **训练历史列表**：最近 20 条训练记录（日期/模式/手牌数/状态）
  - **统计概览**：总训练次数、总手牌数、平均 EV
- 训练历史列表支持点击进入复盘（Phase 2 功能，先占位）

**涉及文件**:
- `src/app/coach/page.tsx`（新建）
- `src/components/poker/coach/coach-page.tsx`（新建）

**验收标准**:
- [ ] `/coach` 页面可独立访问
- [ ] "开始训练"按钮可点击，跳转到训练设置/训练桌面
- [ ] 训练历史列表正确显示
- [ ] 无训练记录时显示空态提示
- [ ] 移动端适配
- [ ] `pnpm ts-check` 零错误

---

### T-908: GTO 纠偏反馈

**优先级**: P1 | **工时**: 4h | **负责人**: @Backend

**说明**:
- 创建 `src/lib/coach/feedback-engine.ts`
- 实现决策对比逻辑：
  - 对比用户动作与 GTO 推荐动作
  - 计算偏差程度（动作一致=0，动作不同=根据频率差值计算）
  - 生成反馈消息（正确/轻微偏差/严重偏差）
- 反馈消息模板：
  - 正确："GTO 推荐 {action}，你的决策正确"
  - 轻微偏差："GTO 推荐 {action}（频率 {freq}%），你选择了 {userAction}"
  - 严重偏差："GTO 推荐 {action}（-EV 决策），你的 {userAction} 预期损失 {evLoss}BB"

**涉及文件**:
- `src/lib/coach/feedback-engine.ts`（新建）
- `src/services/coach-service.ts`（修改，集成反馈）

**验收标准**:
- [ ] 用户动作与 GTO 推荐一致时返回 positive 反馈
- [ ] 用户动作与 GTO 推荐不同且频率 > 30% 时返回 minor_deviation
- [ ] 用户动作与 GTO 推荐不同且频率 <= 30% 时返回 major_deviation
- [ ] 反馈消息包含具体数值
- [ ] `pnpm ts-check` 零错误

---

### T-909: Postflop 简化策略

**优先级**: P1 | **工时**: 6h | **负责人**: @Backend

**说明**:
- 创建 `src/lib/coach/postflop-strategy.ts`
- 实现手牌强度分级逻辑：
  - 根据底牌 + 公共牌评估手牌强度（Nut / Top Pair+ / Middle Pair / Draw / Weak）
  - 考虑同花听牌、顺子听牌、对子+听牌等
- 实现 Postflop GTO 建议规则：
  - 基于手牌强度 + 底池赔率 + 位置 + 对手动作
  - 返回建议动作和频率
- 使用 `bitval` 辅助手牌强度评估

**涉及文件**:
- `src/lib/coach/postflop-strategy.ts`（新建）
- `src/lib/coach/hand-rankings.json`（新建，手牌强度排名数据）

**验收标准**:
- [ ] Flop 顶对+听花正确识别为强牌
- [ ] Flop 底对无听牌正确识别为弱牌
- [ ] 听牌（同花/顺子）正确识别
- [ ] Postflop 建议合理（强牌加注/中等牌过牌/弱牌弃牌）
- [ ] `pnpm ts-check` 零错误

---

### T-910: 训练设置对话框

**优先级**: P2 | **工时**: 2h | **负责人**: @Frontend

**说明**:
- 创建 `training-settings.tsx` 对话框组件
- 设置项：
  - **模式选择**：Cash Game / Tournament（Tournament 置灰，Phase 3）
  - **起始筹码**：滑块/输入（100BB ~ 500BB）
  - **盲注大小**：小盲/大盲选择（1/2, 2/5, 5/10）
  - **对手风格**：GTO（默认）/ 激进 / 被动
- "开始训练"按钮触发创建会话并跳转到训练桌面

**涉及文件**:
- `src/components/poker/coach/training-settings.tsx`（新建）
- `src/app/coach/page.tsx`（修改，集成设置对话框）

**验收标准**:
- [ ] 对话框正确显示所有设置项
- [ ] 参数修改后保存到 Store
- [ ] "开始训练"按钮调用 API 创建会话
- [ ] 创建成功后跳转到训练桌面
- [ ] `pnpm ts-check` 零错误

---

### T-911: 复盘页面基础版

**优先级**: P2 | **工时**: 4h | **负责人**: @Frontend

**说明**:
- 创建 `/coach/review/:sessionId` 页面路由
- 实现复盘页面：
  - **决策统计**：总手牌数、Fold/Check/Call/Raise 分布
  - **偏差概览**：正确率、轻微偏差率、严重偏差率
  - **关键决策点**：EV 损失最大的 5 个决策列表
  - 返回按钮回到教练中心

**涉及文件**:
- `src/app/coach/review/[sessionId]/page.tsx`（新建）
- `src/components/poker/coach/review-page.tsx`（新建）
- `src/components/poker/coach/decision-stats.tsx`（新建）
- `src/components/poker/coach/key-decisions.tsx`（新建）

**验收标准**:
- [ ] 复盘页面显示正确的决策统计
- [ ] 偏差概览数据与训练记录一致
- [ ] 关键决策点列表按 EV 损失排序
- [ ] 无数据时显示友好提示
- [ ] 返回按钮回到教练中心
- [ ] `pnpm ts-check` 零错误

---

## 9. 依赖关系图

```
Sprint 9 任务依赖关系：

无依赖（可并行启动）:
  T-901 (Schema) ───────────────────────────────────────────┐
  T-902 (赔率引擎) ──────┐                                   │
  T-903 (GTO范围表) ─────┤                                   │
                          │                                   │
依赖 T-901:               │                                   │
  T-904 (会话 API) ──────┤                                   │
                          │                                   │
依赖 T-902 + T-903:       │                                   │
  T-906 (对手引擎) ──────┼──────────┐                        │
  T-908 (纠偏反馈) ──────┼──────────┼─┐                      │
                          │          │ │                      │
依赖 T-902:               │          │ │                      │
  T-909 (Postflop) ──────┼──────────┼─┼─┐                    │
                          │          │ │ │                    │
依赖 T-904:               │          │ │ │                    │
  T-905 (桌面 UI) ───────┼──────────┼─┼─┼─┐                  │
  T-907 (教练中心) ──────┼──────────┼─┼─┼─┼─┐                │
  T-911 (复盘页面) ──────┼──────────┼─┼─┼─┼─┼─┐              │
                          │          │ │ │ │ │ │              │
依赖 T-905:               │          │ │ │ │ │ │              │
  T-910 (设置对话框) ────┼──────────┼─┼─┼─┼─┼─┼─┐            │
                          │          │ │ │ │ │ │ │            │
                          ▼          ▼ ▼ ▼ ▼ ▼ ▼ ▼            ▼
                     @Architect 架构确认（前置条件）
```

**执行顺序建议**:

```
Step 1（并行）: T-901 + T-902 + T-903  ← @Backend
Step 2:          T-904                  ← @Backend（依赖 T-901）
Step 3（并行）: T-906 + T-908 + T-909  ← @Backend（依赖 T-902+T-903）
Step 4（并行）: T-905 + T-907 + T-911  ← @Frontend（依赖 T-904）
Step 5:          T-910                  ← @Frontend（依赖 T-905）
Step 6:          @QA 最终验证
```

---

## 10. 注释

1. **新依赖引入**：`poker-odds-calculator` 和 `bitval` 需 [HUMAN-REVIEW:NEW-DEPENDENCY] 确认后才能安装
2. **离线可用**：训练核心功能完全离线，GTO 范围表预加载到内存
3. **训练桌面 UI**：Phase 1 实现静态版本，无过渡动画
4. **对手 AI**：Phase 1 仅支持 GTO 风格对手，多风格在 Phase 2
5. **Postflop 策略**：Phase 1 使用简化启发式规则，不追求 Nash Equilibrium 精确解
6. **Tournament 模式**：Phase 3 实现，Phase 1 仅 Cash Game
7. **Sprint 8 并行**：Sprint 8（赛季总结报告）与 Sprint 9 无代码依赖，可并行推进
8. **复盘页面**：Phase 1 基础版仅显示统计和关键决策点，图表和趋势在 Phase 2/3

---

## 11. 任务领取状态

| 任务 | 状态 | 领取人 | 开始时间 | 预计完成 |
|------|:----:|--------|----------|----------|
| T-901 | ✅ 完成 | @Backend | 2026-06-17 | 2026-06-17 |
| T-902 | ✅ 完成 | @Backend | 2026-06-17 | 2026-06-17 |
| T-903 | ✅ 完成 | @Backend | 2026-06-17 | 2026-06-17 |
| T-904 | ✅ 完成 | @Backend | 2026-06-17 | 2026-06-17 |
| T-905 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |
| T-906 | ✅ 完成 | @Backend | 2026-06-17 | 2026-06-17 |
| T-907 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |
| T-908 | ✅ 完成 | @Backend | 2026-06-17 | 2026-06-17 |
| T-909 | ✅ 完成 | @Backend | 2026-06-17 | 2026-06-17 |
| T-910 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |
| T-911 | ✅ 完成 | @Frontend | 2026-06-17 | 2026-06-17 |

---

## 12. 版本历史

| 版本 | 日期 | 变更内容 | 变更人 |
|:----:|:----:|----------|:------:|
| **9.1** | **2026-06-17** | **Sprint 9 完成：coach API 9个路由实现，TypeScript错误修复，代码审查超长函数拆分，pnpm ts-check 零错误，构建成功。** | **@PM** |
| **9.0** | **2026-06-03** | **Sprint 9 规划：德扑教练功能 MVP（Phase 1），11 个任务（T-901~T-911），P0 核心训练+基础教练+P1 GTO纠偏+Postflop+P2 设置+复盘。PRD 已输出到 .trae/specs/poker-coach-prd.md。** | **@PM** |

---

## Sprint 10 - Excel 数据自动导入

**冲刺名称**: Sprint 10 - Excel 数据自动导入
**版本**: 10.0
**日期**: 2026-06-17
**状态**: 🟢 已完成
**管理者**: @PM

### 任务清单

| 任务 | 优先级 | 说明 | 状态 |
|------|--------|------|:----:|
| T-1001 | P0 | Excel 解析器（xlsx → PokerRecord[]） | ✅ |
| T-1002 | P0 | 增量导入服务（文件哈希去重+事务） | ✅ |
| T-1003 | P0 | 文件夹监控器（fs.watch+防抖+重试） | ✅ |
| T-1004 | P0 | Next.js 启动时初始化监控（instrumentation） | ✅ |
| T-1005 | P1 | 导入状态 API + 前端状态展示 | ✅ |
| T-1006 | P1 | 裁剪手动录入入口（新增导入入口） | ✅ |

### 版本历史

| 版本 | 日期 | 变更内容 | 变更人 |
|:----:|:----:|----------|:------:|
| **10.0** | **2026-06-17** | **Sprint 10 完成：Excel 自动导入功能，6个任务全部实现。xlsx 依赖引入，文件监控+增量导入+导入状态面板。代码审查 H1-H3 修复（Drizzle sql 模板、事务包裹、重试逻辑）。pnpm ts-check 零错误，11/11 测试通过，构建成功。** | **@PM** |

---

*本文档由 @PM 维护*
*最后更新：2026-06-17（Sprint 10 Excel 数据自动导入）*
