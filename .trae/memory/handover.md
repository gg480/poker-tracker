# 交接文档 · Poker Tracker

**版本**: 1.0
**日期**: 2026-05-05
**状态**: 正式
**管理者**: 全员

---

## ✅ 最近完成

| 日期 | 接口/功能 | 说明 | 负责人 |
|------|----------|------|--------|
| 2026-05-05 | AI配置功能 - 技术方案设计完成 | 更新 architecture.md（aiConfigStore + API配置传递说明）、api-contracts.md（config字段 + AIConfig类型）、decisions.md（双通道策略 + 安全约束 + SDK兼容策略） | @Architect |
| 2026-05-05 | Sprint 2 关闭，Sprint 4 启动 | AI配置功能冲刺启动，T-101~T-103 挂起待后续排期 | @PM |
| 2026-05-05 | ai-config-store.ts（初版） | 创建 Zustand + persist Store，含 apiKey/baseUrl/model/temperature | @Frontend |
| 2026-05-05 | 删除腾讯文档集成模块 | 移除 tencent-docs-panel、tencent-docs-service、API路由、lib/api.ts、callback路由，因CSV导入导出非实际需求 | @SOLO Coder |
| 2026-05-05 | PlayerDialog Sheet 重构 | 将 PlayerView 重构为独立 Sheet 组件，位于 `src/components/poker/player/player-dialog.tsx` | @Frontend |
| 2026-05-05 | T-401+T-402: AI 配置前端 UI | 验证 ai-config-store（Zustand+persist）；创建 ai-config-dialog；修改 ai-analysis.tsx 标题栏增加"⚙️ 配置"按钮 | @Frontend |
| 2026-05-05 | **Sprint 4 关闭，Sprint 5 启动** | Sprint 4（AI配置功能）：T-401/T-402 ✅ 完成，T-403/T-404 ⏸️ 挂起。Sprint 5（录入积分界面优化）：T-501~T-506 待执行，纯前端改动，仅改 collaborative-entry.tsx | @PM |
| 2026-05-05 | **Sprint 5 架构确认通过** | architecture.md 更新（6.1节补充组件版本变更）、decisions.md 新增第11节（纯前端增量方案）、确认无 API/数据库变更、无新依赖。**设计完成，@Frontend 可开始 T-501~T-506** | @Architect |
| 2026-05-05 | **Sprint 5 QA 最终验证通过** | 录入积分界面优化 Sprint 5 全部6个任务（T-501~T-506）通过验收。详见下方 QA 验证报告。⚠️ 3个Minor建议已记录 | @QA |
| 2026-05-05 | **Sprint 5 关闭，Sprint 6 启动** | Sprint 5（录入积分界面优化）全部6个任务完成关闭。Sprint 6（整体前端重构）启动，8个任务（T-601~T-608），P0 体验阻断 + P1 体验优化。纯前端改动，无需后端配合。 | @PM |
| 2026-05-05 | **T-601+T-602: 手牌页面补全预填 + 已保存手牌持久化** | T-601: 新增 parseHandRecordToWizardData 解析函数，补全时通过 initialData 传给 HandWizard。T-602: 添加 useEffect 从 API 加载已完成手牌、localStorage 降级缓存、保存后自动刷新列表。涉及 hand-page.tsx。pnpm ts-check 零错误通过。 | @Frontend |
| 2026-05-06 | **Sprint 6 关闭，Sprint 7 启动** | Sprint 6（整体前端重构）全部8个任务（T-601~T-608）通过 QA 验证关闭。Sprint 7（体验优化 · 第二阶段）启动，5个任务（T-701~T-705），P0体验阻断 + P1体验优化 + P2可优化。纯前端改动，无需后端配合。 | @PM |
| 2026-05-06 | **Sprint 7 QA 验证完成** | T-701/T-703/T-704/T-705 ✅ 通过，T-702 ❌ 阻塞（未实现）。详见 Sprint 7 QA 验证报告。 | @QA |
| 2026-05-06 | **T-701 Completed**: SessionCard 展开态添加"编辑"和"删除"按钮 | 修改 session-card.tsx（编辑/删除按钮+删除确认弹窗）、session-list.tsx（传递回调）、collaborative-entry.tsx（editSession prop 编辑模式）、page.tsx（连接流程）。pnpm ts-check 零错误通过。 | @Frontend |
| 2026-05-06 | **T-705 Completed**: 快捷选人面板替代"一键添加全部玩家" | 在 collaborative-entry.tsx 的快捷玩家栏下方添加快捷选人面板（allPlayers 展示为可点击 Badge，已选灰色不可点击，点击添加空行或补全空行），保留"一键添加全部玩家"按钮。pnpm ts-check 零错误通过。 | @Frontend |
| 2026-05-10 | **Sprint 7 关闭，Sprint 8 启动** | Sprint 7（体验优化·第二阶段）全部5个任务（T-701~T-705）通过QA验证关闭（含T-702补完后复验通过）。赛季结束盘点检查功能同步实现。Sprint 8（赛季总结报告）启动，6个任务（T-801~T-806），P0数据看板+大事记+P1图表+颁奖+P2赛季对比。纯前端改动，详见 current-sprint.md。 | @PM |
| 2026-06-17 | **Sprint 8 全部完成** | T-801~T-806 全部实现完成。新增独立页面路由 `/season-report`（赛季总结报告）、底部导航"赛季报告"入口、6个组件（season-report-client/stats-dashboard/highlights-list/trend-chart/season-awards/season-comparison）。复用现有 computeStats / computeSeasonComparison / computeExtendedAwards 函数。pnpm ts-check 仅剩4个 coach 模块预存错误（Sprint 9），新代码零错误。 | @Frontend |
| 2026-06-17 | **Sprint 10 T-1001~T-1004 完成**: Excel 数据自动导入功能 | 新增 4 个文件 + 修改 2 个文件。**T-1001** `src/lib/excel-parser.ts`（Excel 解析器，解析中文日期/玩家/积分/胜负标记，跳过表头，逐行解析）；**T-1002** `src/services/excel-import-service.ts`（增量导入服务，MD5 哈希去重，自动创建赛季/场次，记录导入日志）；**T-1003** `src/lib/file-watcher.ts`（文件夹监控器，fs.watch + 防抖 2s + 重试 3 次）；**T-1004** `src/lib/init-watcher.ts` + `src/instrumentation.ts`（Next.js 16 instrumentation hook，启动时自动初始化）。修改 `src/storage/database/shared/schema.ts`（新增 importLog 表定义）、`src/storage/database/crud.ts`（新增 importLog CRUD）。监控目录 `D:\02工作\texa\数据`，可通过 `EXCEL_WATCH_DIR` 环境变量覆盖。pnpm ts-check 零错误通过。 | @Backend |
| 2026-06-17 | **Sprint 10 T-1005~T-1006 完成**: 导入状态 API + 前端状态展示 + 裁剪手动录入入口 | 新增 4 个文件 + 修改 1 个文件。**T-1005** `src/app/api/import-status/route.ts`（GET 返回监控状态+导入日志，POST 手动触发目录导入）、`src/stores/import-store.ts`（Zustand store，含 loadStatus/triggerImport）、`src/components/poker/import-status-panel.tsx`（三卡片布局：监控状态/手动导入/导入记录列表，含 Empty 空态、Skeleton 加载态、toast 反馈）、`src/components/poker/import-status/import-status-client.tsx`（页面客户端壳，含返回按钮）。**T-1006** `src/app/import-status/page.tsx`（独立页面路由）、修改 `src/app/page.tsx`（底部导航新增"导入"入口，指向 `/import-status`，保留原有"记录"tab 不破坏手动录入，nav padding 从 px-4 调整为 px-3 以容纳 7 个入口）。pnpm ts-check 零错误通过。 | @Frontend+@Backend |

## 📋 待接手

> ### Sprint 9 — 德扑教练功能 MVP（P0/P1/P2）
>
> **Sprint 版本**: 9.0 | **状态**: 🔵 规划中
> **冲刺文档**: [current-sprint.md](./current-sprint.md)
>
> **背景**: 实现德扑教练功能 MVP（Phase 1），包含核心训练模块和基础教练模块。用户可在模拟 Cash Game 桌面上打牌，获得 Preflop GTO 建议和胜率计算，训练记录持久化保存。
>
> **约束**:
> - 新增 3 张数据库表（coach_sessions / coach_decisions / coach_feedback）
> - 引入 2 个新依赖：`poker-odds-calculator` + `bitval` [HUMAN-REVIEW:NEW-DEPENDENCY]
> - 所有改动需通过 `pnpm ts-check`
> - ✅ @Architect 架构设计已完成（详见 decisions.md 第15节、architecture.md 第3.3~3.4节、api-contracts.md 第11节）
>
> ---
>
> #### P0 — 核心功能（必须完成）
>
> | ID | 任务 | 工时 | 负责人 | 涉及文件 |
> |----|------|:----:|--------|----------|
> | **T-901** | 数据库 Schema 变更 — 新增 3 张表 | 2h | @Backend | schema.ts / relations.ts / types.ts |
> | **T-902** | 赔率计算引擎 — 集成 poker-odds-calculator | 3h | @Backend | equity-engine.ts |
> | **T-903** | Preflop GTO 范围表 — 预计算 JSON + 查询逻辑 | 4h | @Backend | gto-engine.ts / preflop-ranges.json |
> | **T-904** | 训练会话 API — 会话 CRUD + 决策记录 API | 4h | @Backend | coach/ API routes + coach-service.ts |
> | **T-905** | 训练桌面 UI — 牌面 + 操作按钮 + 底池 + 胜率 | 8h | @Frontend | coach/ 组件目录 |
> | **T-906** | AI 对手引擎 — GTO 策略对手 | 4h | @Backend | opponent-engine.ts |
> | **T-907** | 教练中心页面 — 训练历史 + 快捷开始 | 3h | @Frontend | /coach page |
>
> #### P1 — 增强功能（建议完成）
>
> | ID | 任务 | 工时 | 负责人 | 涉及文件 |
> |----|------|:----:|--------|----------|
> | **T-908** | GTO 纠偏反馈 — 决策对比 + 偏差分析 | 4h | @Backend | feedback-engine.ts |
> | **T-909** | Postflop 简化策略 — Flop/Turn/River 建议 | 6h | @Backend | postflop-strategy.ts |
>
> #### P2 — 扩展功能（选做）
>
> | ID | 任务 | 工时 | 负责人 | 涉及文件 |
> |----|------|:----:|--------|----------|
> | **T-910** | 训练设置对话框 | 2h | @Frontend | training-settings.tsx |
> | **T-911** | 复盘页面基础版 | 4h | @Frontend | /coach/review/:sessionId |
>
> ---
>
> **工时汇总**: P0 = 24h / P1 = 10h / P2 = 6h / **总计 = 40h**
>
> **依赖关系**:
> - T-901/T-902/T-903 无依赖，可并行启动
> - T-904 依赖 T-901
> - T-906/T-908/T-909 依赖 T-902+T-903
> - T-905/T-907/T-911 依赖 T-904
> - T-910 依赖 T-905
>
> **推荐执行顺序**:
> - @Backend: T-901+T-902+T-903（并行）→ T-904 → T-906+T-908+T-909（并行）
> - @Frontend: 等待 API 后 → T-905 → T-907+T-911（并行）→ T-910
>
> **详细任务描述** 见 [current-sprint.md](./current-sprint.md) 第8节。

---

## 1. 文档目的

本文档用于记录项目开发过程中的交接信息，确保团队成员之间的知识传递和协作顺畅。所有团队成员都有读写权限。

---

## 2. 项目概述

### 2.1 项目基本信息

| 项目 | 值 |
|------|---|
| 项目名称 | 德扑积分榜 (Poker Tracker) |
| 项目版本 | v1.0 |
| 当前状态 | 开发完成，准备发布 |
| 技术栈 | Next.js 16 + React 19 + TypeScript + SQLite + Drizzle ORM + Zustand |

### 2.2 项目结构

```
poker-tracker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (12个)
│   │   ├── globals.css        # 全局样式
│   │   ├── robots.ts          # 爬虫规则
│   │   ├── page.tsx           # 首页
│   │   └── layout.tsx         # 布局
│   ├── components/
│   │   ├── poker/              # 业务组件 (33个)
│   │   └── ui/                # shadcn/ui组件 (51个)
│   ├── hooks/                 # 自定义Hooks
│   │   └── use-mobile.ts      # 移动端检测
│   ├── __tests__/             # 单元测试
│   │   └── data.test.ts       # 数据处理测试
│   ├── services/              # 业务服务 (7个)
│   ├── storage/
│   │   └── database/          # 数据访问层
│   │       ├── shared/         # Schema和关系
│   │       ├── crud.ts        # CRUD操作
│   │       ├── drizzle.ts     # 数据库连接
│   │       └── seed.ts        # 种子数据
│   ├── stores/                # Zustand状态 (5个)
│   └── lib/                   # 工具库
│       ├── types.ts          # 类型定义
│       ├── constants.ts      # 常量
│       ├── utils.ts          # 工具函数
│       ├── data.ts           # 数据处理
│       ├── stats.ts          # 统计计算
│       ├── seed-seasons.ts   # 赛季种子数据
│       └── seed-records.ts   # 记录种子数据
├── data/
│   └── poker-tracker.db      # SQLite数据库
└── .trae/
    └── memory/               # SOP文档
```

---

## 3. 技术交接

### 3.1 数据库Schema

**重要提示**：所有数据库表通过 Drizzle ORM 管理，请勿直接修改 SQLite 文件。

#### 表清单

| 表名 | 说明 | 记录数 | 管理者 |
|------|------|--------|--------|
| seasons | 赛季表 | ~2 | @Backend |
| game_sessions | 场次表 | ~10 | @Backend |
| poker_records | 比赛记录表 | ~200 | @Backend |
| player_settlements | 玩家结算表 | ~5 | @Backend |
| clear_records | 清分记录表 | ~5 | @Backend |
| hand_records | 手牌记录表 | ~20 | @Backend |
| award_records | 奖项记录表 | ~10 | @Backend |
| ai_cache | AI缓存表 | ~5 | @Backend |
| coach_sessions | 训练会话表 | — | @Backend |
| coach_decisions | 决策记录表 | — | @Backend |
| coach_feedback | 反馈记录表 | — | @Backend |

### 3.2 API Routes

| 路由 | 方法 | 说明 | 状态 |
|------|------|------|------|
| /api/seasons | GET/POST/PUT/DELETE | 赛季CRUD | ✅ 正常 |
| /api/sessions | GET/POST/PUT/DELETE | 场次CRUD | ✅ 正常 |
| /api/poker-records | GET/POST/DELETE | 记录CRUD | ✅ 正常 |
| /api/settlements | GET/POST | 结算CRUD | ✅ 正常 |
| /api/clear-records | GET/POST | 清分记录CRUD | ✅ 正常 |
| /api/hands | GET/POST/PUT/DELETE | 手牌CRUD | ✅ 正常 |
| /api/awards | GET/POST | 奖项CRUD | ✅ 正常 |
| /api/ai-analysis | POST | AI分析SSE | ✅ 正常 |
| /api/ai-cache | GET/POST/PUT | AI缓存CRUD | ✅ 正常 |
| /api/import-export | GET/POST | 导入导出 | ✅ 正常 |
| /api/seed | POST | 种子数据 | ✅ 正常 |
| /api/coach/sessions | GET/POST | 训练会话列表/创建 | ✅ 正常 |
| /api/coach/sessions/:id | GET | 训练会话详情 | ✅ 正常 |
| /api/coach/sessions/:id/decisions | POST | 记录决策 | ✅ 正常 |
| /api/coach/sessions/:id/advice | GET | GTO建议（不保存） | ✅ 正常 |
| /api/coach/sessions/:id/complete | POST | 完成训练 | ✅ 正常 |
| /api/coach/sessions/:id/review | GET | 复盘报告 | ✅ 正常 |
| /api/coach/gtoranges | GET | Preflop GTO范围表 | ✅ 正常 |
| /api/coach/equity | POST | 手牌胜率计算 | ✅ 正常 |

### 3.3 Zustand Stores

| Store | 文件 | 状态 |
|-------|------|------|
| uiStore | stores/ui-store.ts | ✅ 正常 |
| recordStore | stores/record-store.ts | ✅ 正常 |
| seasonStore | stores/season-store.ts | ✅ 正常 |
| settlementStore | stores/settlement-store.ts | ✅ 正常 |
| quickEntryStore | stores/quick-entry-store.ts | ✅ 正常 |

---

## 4. 功能模块交接

### 4.1 首页模块 (Home)

**组件**：
- `dashboard.tsx` - 总览面板
- `home/season-overview.tsx` - 赛季概览
- `home/today-summary.tsx` - 今日总结
- `home/clear-radar-alerts.tsx` - 清分预警
- `home/quick-actions.tsx` - 快捷入口

**状态**：✅ 已完成

### 4.2 记录模块 (Record)

**组件**：
- `record-entry.tsx` - 录入面板
- `record/collaborative-entry.tsx` - 协作录入
- `record/session-list.tsx` - 场次列表
- `record/session-card.tsx` - 场次卡片
- `record/entry-status.tsx` - 录入状态
- `record/score-validator.tsx` - 合计校验

**状态**：✅ 已完成

### 4.3 排行模块 (Ranking)

**组件**：
- `ranking-page.tsx` - 排行主页（含 PlayerDialog Sheet）
- `awards-page.tsx` - 奖项页面
- `player/player-dialog.tsx` - 玩家详情 Sheet（右滑面板）

**状态**：✅ 已完成

### 4.4 手牌模块 (Hand)

**组件**：
- `hand-page.tsx` - 手牌主页
- `hand/hand-wizard.tsx` - 完整向导
- `hand/quick-entry-wizard.tsx` - 快速录入
- `hand/card-selector.tsx` - 牌面选择
- `hand/poker-engine.ts` - 扑克引擎
- `hand/poker-card.tsx` - 扑克牌组件
- `hand/gto-engine.ts` - GTO引擎

**状态**：✅ 已完成（含快速手牌录入）

### 4.5 赛季模块 (Season)

**组件**：
- `season-manager.tsx` - 赛季管理
- `season/end-season-dialog.tsx` - 结束赛季对话框

**状态**：✅ 已完成

### 4.6 分享模块 (Share)

**组件**：
- `share/share-card.tsx` - 分享卡片
- `share/share-button.tsx` - 分享按钮

**状态**：✅ 已完成

### 4.7 AI分析模块 (AI)

**组件**：
- `ai-analysis.tsx` - AI分析面板

**状态**：✅ 已完成

### 4.8 个人中心模块 (Profile)

**组件**：
- `profile/profile-page.tsx` - 主页

**状态**：✅ 已完成

### 4.9 赛季总结报告模块 (Season Report)

**组件**：
- `season-report/page.tsx` - 独立页面路由
- `season-report/season-report-client.tsx` - 客户端入口（含赛季选择 + 数据加载）
- `season-report/stats-dashboard.tsx` - 数据看板（总场次/参与人数/场均积分/总积分流动/最大赢家/最大输家）
- `season-report/highlights-list.tsx` - 大事记列表（最大单场盈利/最长连胜/最大逆转/最活跃玩家/最多冠军/清分王）
- `season-report/trend-chart.tsx` - 积分走势图（Recharts LineChart，最多10玩家）
- `season-report/season-awards.tsx` - 赛季颁奖（复用 computeExtendedAwards）
- `season-report/season-comparison.tsx` - 赛季对比（复用 computeSeasonComparison）

**状态**：✅ 已完成

---

## 5. 已知问题

### 5.1 待解决问题

当前无待解决问题。

### 5.2 技术债务

详见 [tech-debt.md](./tech-debt.md)

---

## 6. 运维指南

### 6.1 开发环境启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
# 或
npx next dev -p 5000

# 类型检查
pnpm ts-check

# 代码检查
pnpm lint

# 运行测试
pnpm test              # 单元测试
pnpm test:coverage     # 测试覆盖率
pnpm test:watch        # 监听模式
pnpm test:ui           # UI模式
```

### 6.2 数据库操作

**数据库文件位置**：`data/poker-tracker.db`

**查看数据库**：
```bash
sqlite3 data/poker-tracker.db
sqlite> .tables
sqlite> SELECT * FROM seasons;
```

**初始化种子数据**：
```bash
curl -X POST http://localhost:5000/api/seed
```

### 6.3 生产构建

```bash
pnpm build
pnpm start
```

---

## 7. 联系人

| 角色 | 负责人 | 备注 |
|------|--------|------|
| 项目负责人 | @SOLO Coder | 任务调度 |
| 架构师 | @Architect | 技术方案 |
| 后端开发 | @Backend | API/数据层 |
| 前端开发 | @Frontend | UI组件 |
| 测试 | @QA | 质量保障 |

---

## 8. 变更记录

| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-05-05 | AI配置功能技术方案设计完成（architecture.md/api-contracts.md/decisions.md更新），标注"设计完成，@Backend和@Frontend可开始并行" | @Architect |
| 2026-05-05 | 初始版本，完整项目交接 | @SOLO Coder |
| 2026-05-05 | 补充目录结构、更新组件计数、移除已解决种子数据问题、添加测试命令 | @SOLO Coder |
| 2026-05-05 | 删除腾讯文档集成模块（移除 tencent-docs-panel/service/API路由/api.ts/callback） | @SOLO Coder |
| 2026-05-05 | 修复全部 ESLint 问题（95→0）：删除未使用变量/import 30处，替换 any 为具体类型 40处 | @Frontend |
| 2026-05-05 | 玩家详情重构：将内嵌 PlayerView 改造为独立 Sheet 组件 PlayerDialog | @Frontend |
| 2026-05-05 | Sprint 5 架构确认通过，标记"设计完成，@Frontend 可开始并行" | @Architect |
| 2026-05-05 | **Sprint 5 关闭 + Sprint 6 启动**：Sprint 5（录入积分界面优化）全部6个任务通过QA验收并关闭。Sprint 6（整体前端重构）启动，8个任务（T-601~T-608），P0 体验阻断 + P1 体验优化，纯前端改动。更新 current-sprint.md 和 handover.md | @PM |
| 2026-05-06 | **Sprint 6 关闭 + Sprint 7 启动**：Sprint 6（整体前端重构）全部8个任务（T-601~T-608）通过QA验证关闭。Sprint 7（体验优化 · 第二阶段）启动，5个任务（T-701~T-705），P0体验阻断 + P1体验优化 + P2可优化，纯前端改动。更新 current-sprint.md 和 handover.md | @PM |
| 2026-05-06 | **T-701 Completed**: SessionCard 展开态添加"编辑"和"删除"按钮 | 修改 session-card.tsx（编辑/删除按钮+删除确认弹窗）、session-list.tsx（传递回调）、collaborative-entry.tsx（editSession prop 编辑模式）、page.tsx（连接流程）。pnpm ts-check 零错误通过。 | @Frontend |
| 2026-05-06 | **T-705 Completed**: 快捷选人面板替代"一键添加全部玩家" | 在 collaborative-entry.tsx 的快捷玩家栏下方添加快捷选人面板（allPlayers 展示为可点击 Badge，已选灰色不可点击，点击添加空行或补全空行），保留"一键添加全部玩家"按钮。pnpm ts-check 零错误通过。 | @Frontend |
| 2026-05-06 | **Sprint 7 QA 验证完成** | 见下方 Sprint 7 QA 验证报告。 | @QA |
| 2026-05-10 | **Sprint 7 关闭 + Sprint 8 启动** | Sprint 7（体验优化·第二阶段）5个任务全部通过QA验证（T-702补完后复验通过）。赛季结束盘点检查功能同步实现。Sprint 8（赛季总结报告）启动，6个任务（T-801~T-806）。 | @PM |
| 2026-05-10 | **Sprint 8 架构确认通过** | decisions.md 新增第14节（混合路由决策 + 数据流设计 + computeSeasonComparison 能力确认 + 约束确认）；architecture.md 更新（模块架构 + 组件目录）。确认无需更新 api-contracts.md。**设计完成，@Frontend 可开始 T-801~T-806** | @Architect |
| 2026-06-03 | **Sprint 9 德扑教练模块 — 架构设计完成** | architecture.md 更新（3张新表ER图 + 5个核心引擎接口定义 + 教练模块文件结构 + coachStore + coachService + API路由 + 组件树）；api-contracts.md 新增第11节（8个教练API接口 + 5个数据类型定义）；decisions.md 新增第15节（9项架构决策 + 约束确认 + 风险评估）。**设计完成，@Backend 和 @Frontend 可开始并行** | @Architect |
| 2026-06-17 | **Sprint 8 赛季总结报告全部完成** | 新增 `src/app/season-report/page.tsx`（独立页面路由）、`src/components/poker/season-report/season-report-client.tsx`（客户端入口 + 赛季选择 + 数据加载）、`stats-dashboard.tsx`（6项数据看板）、`highlights-list.tsx`（6项大事记）、`trend-chart.tsx`（Recharts折线图，最多10玩家）、`season-awards.tsx`（颁奖典礼）、`season-comparison.tsx`（赛季对比）。底部导航新增"赛季报告"入口。`pnpm ts-check` 新代码零错误（仅剩4个coach模块预存错误）。 | @Frontend |
| 2026-06-17 | **Sprint 9 后端 API 实现完成** | T-901~T-904/T-906~T-909 后端任务全部完成。修复 4 个 TypeScript 错误（feedback-engine.ts:199 / opponent-engine.ts:78 / relations.ts:84 / types.ts TrainingSettings）。新建 `coach-service.ts`（业务逻辑层）、8 个 API 路由（sessions CRUD / decisions / advice / complete / review / gtoranges / equity）。`pnpm ts-check` 零错误通过。 | @Backend |

---

## Sprint 9 架构设计 — 设计完成

> **冲刺**: Sprint 9 — 德扑教练功能 MVP（Phase 1）
> **状态**: ✅ 架构设计完成，@Backend 和 @Frontend 可开始并行
>
> ### 设计产出
>
> | 文档 | 变更内容 |
> |------|----------|
> | [architecture.md](./architecture.md) | 新增教练模块架构（v1.6）：数据库ER图（3张新表）、5个核心引擎接口定义（OddsCalculator/GTORangeTable/PostflopStrategy/DecisionEvaluator/OpponentEngine）、教练模块文件结构（src/lib/coach/）、coachStore（4.1节）、coachService（4.2节）、API路由结构（5.1节 coach/）、组件目录结构（6.1节 coach/） |
> | [api-contracts.md](./api-contracts.md) | 新增第11节教练模块接口（v1.2）：8个 RESTful API（sessions CRUD / decisions / advice / complete / review / gtoranges / equity）+ 5个数据类型定义（CoachSession / CoachDecision / CoachFeedback / GTOAdvice / CoachReviewReport） |
> | [decisions.md](./decisions.md) | 新增第15节（v1.7）：9项架构决策（数据库Schema / 引擎架构 / Preflop GTO预计算 / Postflop简化策略 / RESTful API / 前端路由 / Zustand Store / 约束确认 / 风险评估） |
>
> ### 任务分配
>
> **@Backend 启动顺序**:
> - Step 1（并行）: T-901 Schema + T-902 赔率引擎 + T-903 GTO 范围表
> - Step 2: T-904 训练会话 API（依赖 T-901）
> - Step 3（并行）: T-906 对手引擎 + T-908 纠偏反馈 + T-909 Postflop 策略（依赖 T-902+T-903）
>
> **@Frontend 启动顺序**（等待 API 契约确定后）:
> - Step 1: T-905 训练桌面 UI（依赖 T-904）
> - Step 2（并行）: T-907 教练中心 + T-911 复盘页面（依赖 T-904）
> - Step 3: T-910 训练设置对话框（依赖 T-905）
>
> **⚠️ 前置条件**:
> - 引入 `poker-odds-calculator` + `bitval` 需 [HUMAN-REVIEW:NEW-DEPENDENCY] 确认
> - T-904 开始前需先完成 T-901（数据库迁移）
>
> **详细任务描述** 见 [current-sprint.md](./current-sprint.md) 第8节。

---

## Sprint 7 QA 验证报告（最终版）

**首轮验证日期**: 2026-05-06
**复验（T-702）日期**: 2026-05-10
**验证人**: @QA
**类型检查**: ✅ `pnpm ts-check` 零错误通过

### 验收结果汇总

| 任务 | 优先级 | 验收项 | 首轮 | 复验 |
|:----:|:------:|--------|:---:|:----:|
| **T-701** | P0 | SessionCard 展开态底部有"✏️ 编辑"和"🗑️ 删除"按钮 | ✅ | — |
| | | 点击"编辑" → CollaborativeEntry 预填该场次数据 | ✅ | — |
| | | 编辑模式下有金色边框和"编辑模式"标记 | ✅ | — |
| | | 修改后保存 → 旧数据被替换 → 自动退出编辑模式 | ✅ | — |
| | | 点击"删除" → 二次确认弹窗 → 确认后场次消失 | ✅ | — |
| **T-702** | P0 | 导入按钮在新建赛季且无玩家时显示 | ❌ | ✅ |
| | | 点击后读取上赛季玩家列表并添加 | ❌ | ✅ |
| | | 导入的玩家自动去重，不重复添加 | ❌ | ✅ |
| | | 无历史赛季时按钮置灰并提示 | ❌ | ✅ |
| | | 不影响现有手动添加玩家流程 | ❌ | ✅ |
| **T-703** | P1 | Dashboard"最近场次"表格右侧有渐隐效果（ScrollIndicator + mask-image） | ✅ | — |
| | | 表格底部有"← 左右滑动查看更多 →"提示 | ✅ | — |
| | | 滑动一次后指示器永久消失 | ✅ | — |
| **T-704** | P1 | 有 sessionId 时头部显示"新场次"按钮 | ✅ | — |
| | | 点击后重置为空白录入状态 | ✅ | — |
| **T-705** | P2 | 录入表格上方有玩家 Badge 列表（快捷选人面板） | ✅ | — |
| | | 点击未选中玩家 → 添加该行 | ✅ | — |
| | | 已选中玩家标记为灰色不可点 | ✅ | — |

### 首轮 Bug

[BUG-20260506-01]（已修复）
**严重级别**: Critical → ✅ 已解决
**描述**: T-702（P0 体验阻断）"从上赛季导入玩家列表"功能未实现
**修复说明**: @Frontend 在 collaborative-entry.tsx 中实现了 `handleImportFromLastSeason` 函数，从 `allPlayersFromRecords` 读取上赛季玩家列表并去重添加至当前赛季池。无历史赛季时按钮不显示。`pnpm ts-check` 零错误。

### 最终结论

✅ **全部通过 — Sprint 7 正常关闭**

- 首轮：T-701 / T-703 / T-704 / T-705 全部验收通过；T-702 ❌ 阻塞
- 复验（2026-05-10）：T-702 完成实现，5项验收项全部通过 ✅
- 全部5个任务验收通过，类型检查零错误
- 赛季结束盘点检查功能（end-season-dialog.tsx）额外完成并验证通过

---

*本文档由全员维护*
*最后更新：2026-06-17*
