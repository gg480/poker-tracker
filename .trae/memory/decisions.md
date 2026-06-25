# 技术决策 · Poker Tracker

**版本**: 1.0
**日期**: 2026-05-05
**状态**: 正式
**管理者**: @Architect

---

## 1. 概述

本文档记录德扑积分榜项目中的重要技术决策，包括技术选型、架构设计、业务规则等方面的决策。所有决策都经过评审并记录在此，供团队参考和追溯。

**访问权限**：除 @Architect 外，其他成员为只读。

---

## 2. 技术选型决策

### 2.1 框架选型

**决策**：采用 Next.js 16 (App Router) 作为全栈框架

| 选项 | 决策 | 理由 |
|------|------|------|
| Next.js 16 | ✅ 采纳 | React生态成熟、SSR/SSG支持、API Routes方便 |
| Remix | ❌ 拒绝 | 社区相对较小 |
| Vite + React | ❌ 拒绝 | 缺少服务端渲染能力 |

**日期**：2026-04-26
**决策人**：@Architect

### 2.2 数据库选型

**决策**：采用 SQLite 本地文件存储

| 选项 | 决策 | 理由 |
|------|------|------|
| SQLite | ✅ 采纳 | 本地优先、数据主权、零配置、高性能 |
| PostgreSQL (Supabase) | ❌ 放弃 | 依赖云服务、与产品定位矛盾 |
| MongoDB | ❌ 拒绝 | 不适合结构化数据 |

**日期**：2026-04-26
**决策人**：@Architect

**备注**：未来可考虑支持云端同步（v2.0）

### 2.3 ORM选型

**决策**：采用 Drizzle ORM

| 选项 | 决策 | 理由 |
|------|------|------|
| Drizzle ORM | ✅ 采纳 | 类型安全、轻量级、SQLite原生支持 |
| Prisma | ❌ 拒绝 | 对SQLite支持不如Drizzle |
| raw SQL | ❌ 拒绝 | 类型安全缺失 |

**日期**：2026-04-26
**决策人**：@Architect

### 2.4 状态管理选型

**决策**：采用 Zustand

| 选项 | 决策 | 理由 |
|------|------|------|
| Zustand | ✅ 采纳 | 轻量(1KB)、无boilerplate、支持persist |
| Redux | ❌ 拒绝 | 过于复杂 |
| Context API | ❌ 拒绝 | 性能问题 |

**日期**：2026-04-26
**决策人**：@Architect

### 2.5 UI组件库选型

**决策**：采用 shadcn/ui

| 选项 | 决策 | 理由 |
|------|------|------|
| shadcn/ui | ✅ 采纳 | 基于Radix UI、可定制、代码所有权 |
| Material UI | ❌ 拒绝 | 样式固定、Bundle大小 |
| Ant Design | ❌ 拒绝 | 企业风格、不符合设计语言 |

**日期**：2026-04-26
**决策人**：@Architect

---

## 3. 架构设计决策

### 3.1 本地优先架构

**决策**：采用本地优先的数据存储策略

**规则**：
- 所有数据优先存储在本地SQLite
- JSON导入导出作为数据备份和恢复手段
- 云端同步作为可选功能（v2.0规划）

**理由**：
- 数据主权：用户数据完全自主
- 离线可用：无需网络连接
- 隐私安全：数据不经过第三方服务器

**日期**：2026-04-26
**决策人**：@Architect

### 3.2 多人协作模式

**决策**：v1.0采用"同设备轮流录入"模式

**规则**：
- 多人协作但同设备操作
- 场次状态机：pending → collected → confirmed
- 零和校验：所有玩家积分合计必须为零

**理由**：
- v1.0复杂度可控
- 数据一致性有保障
- 未来可扩展为局域网同步（v1.x）

**日期**：2026-04-26
**决策人**：@Architect

### 3.3 清分雷达机制

**决策**：设置8000分清分阈值

**规则**：
- 预警线：6400分（80%）
- 触发线：8000分（100%）
- 催办间隔：48小时

**余额公式**：
```
balance = total_score - settle_score + season_adjust
```

**日期**：2026-04-26
**决策人**：@Architect

---

## 4. 业务规则决策

### 4.1 赛季管理

**决策**：赛季积分全清机制

**规则**：
- 赛季结束：所有玩家积分封存
- 新赛季：所有玩家积分重置为0
- 请吃饭累计：跨赛季延续
- 赛季调整：用于余额归零

**日期**：2026-04-26
**决策人**：@Architect

### 4.2 手牌记录模式

**决策**：支持双模式手牌录入

**模式**：
1. **快速记录**：3步完成（选牌→结果→标签），isComplete=false
2. **完整记录**：完整Wizard流程，isComplete=true

**补全机制**：
- 快速记录可后续补全为完整记录
- 使用PUT更新isComplete=true

**日期**：2026-05-05
**决策人**：@Architect

### 4.3 奖项系统

**决策**：16+奖项体系

**分类**：
- 赢家奖项：6个（赛季冠军、财富之星等）
- 输家鼓励奖：6个（凤凰涅槃、永不言弃等）
- 特别奖项：3个（风度奖、记录之星、气氛组）

**日期**：2026-04-26
**决策人**：@Architect

---

## 5. API设计决策

### 5.1 响应格式

**决策**：统一响应格式

```typescript
// 成功
{ success: true, data: T | null }

// 错误
{ success: false, data: null, error: string }
```

**日期**：2026-04-26
**决策人**：@Architect

### 5.2 SSE流式响应

**决策**：AI分析使用Server-Sent Events

**事件格式**：
```
data: {"type":"content","content":"..."}
data: {"type":"done"}
data: {"type":"error","error":"..."}
```

**理由**：AI分析内容较长，流式输出体验更好

**日期**：2026-04-26
**决策人**：@Architect

---

## 6. 文件结构决策

### 6.1 组件目录结构

**决策**：按功能模块划分组件目录

**结构**：
```
components/poker/
├── home/         # 首页
├── record/       # 记录
├── ranking/      # 排行
├── hand/         # 手牌
├── season/       # 赛季
├── share/        # 分享
├── player/       # 玩家
├── profile/      # 个人中心
├── ai/           # AI分析
└── common/       # 公共组件
```

**理由**：高内聚低耦合、易于导航

**日期**：2026-04-26
**决策人**：@Architect

### 6.2 状态管理目录

**决策**：Zustand stores集中管理

**结构**：
```
stores/
├── ui-store.ts          # UI状态
├── record-store.ts      # 记录状态
├── season-store.ts     # 赛季状态
├── settlement-store.ts # 结算状态
└── quick-entry-store.ts # 快速录入状态
```

**理由**：统一入口、便于状态追踪

**日期**：2026-04-26
**决策人**：@Architect

---

## 7. 安全决策

### 7.1 禁止使用 any 类型

**决策**：TypeScript严格模式，禁止使用 `any` 类型

**理由**：类型安全、编译时错误检测

**日期**：2026-04-26
**决策人**：@Architect

### 7.2 禁止直接数据库修改

**决策**：所有数据库操作必须通过Drizzle ORM

**理由**：
- 类型安全
- 迁移管理
- 一致性保证

**日期**：2026-04-26
**决策人**：@Architect

---

## 8. 性能决策

### 8.1 冷启动优化

**目标**：< 2秒

**策略**：
- SQLite同步读取
- Zustand hydration
- 组件懒加载

**日期**：2026-04-26
**决策人**：@Architect

### 8.2 列表性能

**目标**：≥ 60fps

**策略**：
- React.memo优化
- 虚拟滚动（大数据量时）
- 防抖节流

**日期**：2026-04-26
**决策人**：@Architect

---

## 9. 测试策略决策

### 9.1 测试框架选型

**决策**：采用 Vitest 作为单元测试框架

| 选项 | 决策 | 理由 |
|------|------|------|
| Vitest | ✅ 采纳 | 轻量级、与Vite生态兼容、零配置启动、兼容Jest API、运行速度快 |
| Jest | ❌ 拒绝 | 配置繁琐、与Vite/Next兼容性差、迁移成本高 |
| Mocha + Chai | ❌ 拒绝 | 缺少内置断言库、需额外配置、生态老化 |

**日期**：2026-05-05
**决策人**：@Architect

**理由**：
- 项目使用 Next.js + Vite 构建工具链，Vitest 原生兼容
- 零配置即可运行，降低测试入门门槛
- 与 TypeScript 无缝集成
- 支持 ES Module 原生语法
- 提供 coverage、watch mode 等开箱即用功能

### 9.2 E2E 测试框架选型

**决策**：采用 Playwright 作为端到端测试框架

| 选项 | 决策 | 理由 |
|------|------|------|
| Playwright | ✅ 采纳 | 跨浏览器支持、自动等待、网络拦截、性能优于 Cypress |
| Cypress | ❌ 拒绝 | 仅支持 Chromium、运行速度慢、社区活跃度下降 |
| Puppeteer | ❌ 拒绝 | 缺少内置断言、测试报告能力弱 |

**日期**：2026-05-05
**决策人**：@Architect

### 9.3 测试覆盖策略

**决策**：分层测试策略 + 关键路径全覆盖

**覆盖目标**：
- **单元测试**：service 层 ≥ 90%，utils/helpers ≥ 90%
- **组件测试**：核心交互组件 ≥ 70%，使用 Testing Library
- **集成测试**：API Route 核心流程 ≥ 80%
- **E2E 测试**：用户核心链路 100%（录入→统计→结算）

**分层规则**：
```
单元测试（Vitest）← 组件测试（Vitest + Testing Library）← 集成测试（Vitest）← E2E（Playwright）
```

**日期**：2026-05-05
**决策人**：@Architect

---

## 10. AI配置策略决策

### 10.1 AI配置自定义方案

**决策**：前端 localStorage 持久化存储 AI 配置，通过请求体传入后端，后端采用双通道策略（coze SDK / fetch 直连）

**选型对比**：

| 方案 | 决策 | 理由 |
|------|------|------|
| 前端传入配置（请求体） | ✅ 采纳 | 每个用户可独立配置，不依赖环境变量 |
| 环境变量配置 | ❌ 拒绝 | 所有用户共享同一配置，无法支持个性化 API Key |
| 后端独立配置表 | ❌ 拒绝 | 过度设计，v1.0 无需支持多用户配置隔离 |

**配置生效规则**：

```
请求体携带 config
  ├── apiKey + baseUrl 有值 → fetch 直连 OpenAI 兼容 API（双通道）
  ├── 仅有 model/temperature → 覆盖 coze SDK 参数
  └── config 为空 → 使用 coze SDK 默认值（完全向后兼容）
```

**日期**：2026-05-05
**决策人**：@Architect

### 10.2 安全约束

**决策**：API Key 通过 HTTPS 传至后端，后端透传不落盘

**规则**：
- API Key 使用 password 类型的 input 输入
- 传输过程加密（HTTPS）
- 后端收到后仅用于构造 LLM 请求，不写入数据库、不打印日志
- 前端 localStorage 存储不做额外加密（纯前端工具，权衡后接受此风险）

**日期**：2026-05-05
**决策人**：@Architect

### 10.3 coze SDK 兼容策略

**决策**：coze SDK 不自定义 Config，当用户配置 apiKey+baseUrl 时降级为 fetch 直连

**理由**：
1. `coze-coding-dev-sdk` 的 `Config` 构造函数不接收自定义 apiKey/baseUrl 参数
2. SDK 的 `LLMClient.stream()` 仅支持设置 model/temperature，无法透传自定义 baseUrl
3. 双通道策略：保留 coze SDK 作为默认通道，引入 fetch 直连作为自定义通道
4. 将 `model` 和 `temperature` 的覆盖逻辑统一从请求体读取，无论走哪个通道都生效

**实现要点**：
- 后端引入辅助函数 `callLLM()`，内部根据是否有 apiKey+baseUrl 选择通道
- 两个通道的 SSE 输出格式保持一致（`data: {"content":"..."}\n\n`）
- 不删除 coze SDK 依赖，保持向后兼容

**日期**：2026-05-05
**决策人**：@Architect

---

## 11. 录入积分界面优化 — 纯前端增量方案

**决策**：Sprint 5（录入积分界面优化）采用纯前端增量方案，不涉及后端和数据架构变更

**日期**：2026-05-05
**决策人**：@Architect

### 11.1 Phase 1 实施方案

| 任务 | 方案 | 实现要点 |
|------|------|----------|
| T-501 快捷玩家栏 | 在录入区上方渲染 Badge 标签组 | 复用 `allPlayers` / `enteredPlayers` 已有计算值；未录入玩家点击触发 `updateRow`；使用 `overflow-x-auto` 实现横向滚动 |
| T-502 积分快捷按钮组 | 每行积分输入框旁内嵌6个 Button | 调整 grid 布局为 `grid-cols-[1fr_120px_auto_36px]`；点击调用 `updateRow(i, "score", value)`；正/负值使用 Tailwind 颜色类区分 |
| T-503 合计栏 sticky 固定 | CSS `position: sticky` + `bottom: 0` | 将合计栏所在容器设为 `overflow-y-auto`；合计栏自身 `sticky bottom-0 bg-background`；兼容 Safari 自动处理 -webkit-sticky |

### 11.2 约束确认

| 约束项 | 确认结果 |
|--------|----------|
| 纯前端改动 | ✅ 是，全部在 collaborative-entry.tsx 内完成 |
| 不改后端/数据库 | ✅ 无 API 变更，无 Schema 变更 |
| 增量添加 | ✅ 不删除现有功能，仅在现有 DOM 基础上扩展 |
| 无新依赖 | ✅ 全部使用已有 shadcn/ui 组件（Badge, Button）和 Tailwind CSS |
| 文件所有权 | ✅ 仅修改 `src/components/` 下文件（@Frontend 所有） |

### 11.3 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| collaborative-entry.tsx 超过300行 | 中 | Phase 1 增量约80-100行，总文件预计350行；Sprint 5 结束后评估拆分 |
| 快捷按钮与手动输入状态冲突 | 低 | 快捷按钮仅改写 `score` 字段，与手动输入共用同一 setter (`updateRow`)，天然兼容 |

---

## 12. 整体前端重构（Sprint 6）— 纯前端体验优化

**决策**：Sprint 6 采用纯前端增量方案，8个任务均为前端改动，不涉及后端 API、数据库 Schema 或 `api-contracts.md`。

**日期**：2026-05-05
**决策人**：@Architect

### 12.1 T-601 手牌补全预填 — actions JSON → HandWizardData 映射

**现状**：
- `hand-page.tsx` 中点击"补全"按钮时，`completingHand` 持有 `HandRecord` 对象
- `HandWizard` 组件已有 `initialData?: Partial<HandWizardData>` prop（位于 [hand-wizard.tsx](file:///d:/02工作/texa/poker-tracker/src/components/poker/hand/hand-wizard.tsx#L46-L55)）
- 但 [hand-page.tsx](file:///d:/02工作/texa/poker-tracker/src/components/poker/hand/hand-page.tsx#L364-L369) 未传入 `initialData`

**实现方案**：
```
hand.actions (JSON string)
  → JSON.parse → { heroCards, heroPosition, numPlayers, blinds, history }
  → 映射为 HandWizardData 子集
  → 传给 <HandWizard initialData={mappedData} />
```

**映射逻辑**（在 hand-page.tsx 的 handleCompleteHand 中或抽取工具函数）：
| actions 字段 | HandWizardData 字段 | 类型转换 |
|-------------|-------------------|---------|
| heroCards (string[]) | heroCards (Card[]) | `cardName` → `parseCardCode` |
| heroPosition (string) | heroPosition (Position) | 直接赋值 |
| numPlayers (number) | numPlayers (number) | 直接赋值 |
| blinds ({ sb, bb }) | blinds ({ sb, bb }) | 直接赋值 |
| history (GameAction[][]) | history (GameAction[][]) | 直接赋值 |

**边界处理**：
- `hand.actions` 为空/JSON解析失败 → 不传 `initialData`，保持现有空状态
- `heroCards` 少于2张 → 不预填手牌，仅预填人数/位置
- `flopCards/turnCard/riverCard` 在 actions 中不存在 → HandWizard 保持空状态

### 12.2 T-602 手牌持久化 — API双写 + localStorage降级

**数据流**：
```
保存时:
  HandWizard/QuickEntry → POST /api/hands (主)
                         → localStorage (辅, 离线降级)

加载时:
  页面挂载 → GET /api/hands?season_id=xxx (主)
           → localStorage (降级, API不可用时)
```

**状态管理变更**：
- [hand-page.tsx](file:///d:/02工作/texa/poker-tracker/src/components/poker/hand/hand-page.tsx#L114) `savedHands: useState<SavedHand[]>` → 改为从 API 加载
- 新增 `useEffect` 在 mount 时调用 `GET /api/hands`
- 保存时使用 `handleWizardSave` / `handleQuickSave`（现有逻辑已调用 API，需补充 localStorage 双写）

**降级策略**：
| 场景 | 行为 |
|------|------|
| API 保存成功 + localStorage 写入 | 正常流程 |
| API 保存失败 | localStorage 保留 + Toast "已保存至本地，服务器同步失败" |
| 加载时 API 不可用 | 从 localStorage 读取，静默降级 |

### 12.3 T-603 ErrorBoundary — 手写 Class Component 方案

**决策**：手写 Class Component 实现 ErrorBoundary，不引入 `react-error-boundary` 依赖。

| 方案 | 决策 | 理由 |
|------|------|------|
| 手写 Class Component | ✅ **采纳** | 零依赖、约50行代码、与 Next.js 兼容性好 |
| `react-error-boundary` | ❌ 拒绝 | 额外依赖(3KB)、与现有 shadcn/ui 风格不一致 |

**布局策略**：
```
layout.tsx (Server Component)
  → ErrorBoundary (Client Component wrapper)
    → {children} (所有页面内容)
      → 各 page.tsx 内的 Tab 内容区（局部 ErrorBoundary）
```

**关键设计**：
- `layout.tsx` 外层：包裹整个 `{children}`，兜底全局未捕获 React 错误
- `page.tsx` Tab 内容区：可选的局部 ErrorBoundary 包裹每个 Tab 内容，防止单个 Tab 崩溃影响其他 Tab
- 降级 UI 包含：错误图标 + "页面出现异常" 文案 + "重新加载" 按钮
- 开发环境保留 `error.stack` 便于调试
- 与现有 Next.js `error.tsx` 不冲突（ErrorBoundary 捕获 render 阶段的 React 错误，`error.tsx` 捕获 Next.js 层面的路由/数据错误）

**文件位置**：
- 新建 `src/components/common/error-boundary.tsx`（@Frontend 所有）
- 修改 `src/app/layout.tsx` 包裹 `{children}`（@Frontend 所有，但 layout.tsx 是 Server Component，需抽一个 Client wrapper）

### 12.4 T-604 SessionList 传真实 sessions

**现状**：
- [page.tsx](file:///d:/02工作/texa/poker-tracker/src/app/page.tsx#L270)：`<SessionList sessions={[]} ... />` — 传空数组
- [record-store.ts](file:///d:/02工作/texa/poker-tracker/src/stores/record-store.ts#L7)：已有 `sessions: GameSession[]` 状态和 `loadSessions` action
- [GET /api/sessions](file:///d:/02工作/texa/poker-tracker/src/app/api/sessions/route.ts#L16-L38)：支持按 `season_id` 过滤

**方案**：
1. 在 `page.tsx` 的 `loadData()` 中增加 `GET /api/sessions` 调用 → `loadSessions(apiSessions)`
2. 将 `useRecordStore` 中的 `sessions` 传给 `SessionList`

**风险**：如果 sessions 数据在 localStorage 和 API 间存在冲突，以 API 为准。仅在 API 不可用时降级到 localStorage（已有 persist 中间件）。

### 12.5 T-605 骨架屏 — 渐进式组件化

**决策**：抽取通用骨架屏基座组件，页面级变体通过 props 配置，不做一步到位。

**组件结构**：
```
skeleton-page.tsx
├── export: SkeletonBase (通用基座)
│   ├── Props: { type: 'list' | 'card' | 'table'; rows?: number }
│   └── 使用: shadcn/ui <Skeleton> + Tailwind animate-pulse
├── export: HomeSkeleton (首页)
├── export: RankingSkeleton (排行页)
├── export: HandSkeleton (手牌页)
└── 后续扩展: SessionListSkeleton, ProfileSkeleton
```

**替换范围**（Sprint 6 范围）：
| 页面 | 当前占位 | 替换为 |
|------|---------|--------|
| 排行页 | "加载中..." | RankingSkeleton |
| 手牌页 | "加载中..." | HandSkeleton |
| 录入场次列表 | 无显式加载态 | SessionListSkeleton |
| 个人中心 | "加载中..." | ProfileSkeleton |

### 12.6 T-606 排行样式统一 — RankRow 组件抽取

**现状**：
- [ranking-page.tsx](file:///d:/02工作/texa/poker-tracker/src/components/poker/ranking/ranking-page.tsx#L52-L76)：龙虎榜前3名样式使用内联条件判断（`i === 0 ? "bg-amber-500/5" : i === 1 ? ...`）
- 进度条仅在胜率榜中存在为 `w-16` 固定宽度

**方案**：
1. 抽取 `RankRow` 组件到 `src/components/poker/ranking/rank-row.tsx`
2. Props: `{ rank: number; name: string; ...data: { score: number; games?: number; progress?: number } }`
3. 进度条宽度改为 `w-full max-w-[200px]`，以赛季最高分动态计算
4. 前3名背景色统一使用 RankRow 内部逻辑（移除内联条件判断）

### 12.7 T-607 自动聚焦 — ref + useEffect 控制焦点

**实现方案**：
- 在 [collaborative-entry.tsx](file:///d:/02工作/texa/poker-tracker/src/components/poker/record/collaborative-entry.tsx) 中：
  - 每行 Score Input 绑定 `ref`（使用 `useRef` 数组或 callback ref）
  - 输入完成（回车/失焦）后，找到下一个 `score === ""` 的行
  - 使用 `refs[nextEmptyRow]?.focus()` 聚焦
  - 所有行已填满时不改变焦点

**考虑**：collaborative-entry.tsx 当前 705 行，改动后接近 720 行。虽超出 50 行/函数的个人规则，但本冲刺不做拆分（Sprint 5 遗留评估项，待单独 Sprint）。

### 12.8 T-608 个人中心 — hydration + 导入软刷新

**hydration 修复方案**：
- 使用 `next/dynamic` + `ssr: false` 动态导入不兼容 SSR 的子组件
- 在 [profile-page.tsx](file:///d:/02工作/texa/poker-tracker/src/components/poker/profile/profile-page.tsx#L37-L40) 中 `localStorage.getItem()` 已在 `useState` 初始化器中做 `typeof window === "undefined"` 判断，该写法正确。若有其他 SSR 不兼容代码，用 `dynamic` 包裹

**导入软刷新方案**：
- [page.tsx](file:///d:/02工作/texa/poker-tracker/src/app/page.tsx#L220)：`window.location.reload()` → 改为调用 `loadRecords` / `loadSeasons` / `loadSettlements` 刷新 store 数据
- 导入成功后，重新 fetch 各 API 端点，刷新 store
- 保持 Tab 选中项、滚动位置等页面状态

---

## 13. 体验优化·第二阶段（Sprint 7）— 纯前端体验优化

**决策**：Sprint 7 采用纯前端增量方案，5个任务（T-701 ~ T-705）均为前端改动，不涉及后端 API、数据库 Schema 或 `api-contracts.md`。

**日期**：2026-05-06
**决策人**：@Architect

### 13.1 T-701 SessionCard 展开态添加编辑/删除按钮

**方案**：
- **编辑**：展开态底部添加"编辑积分"按钮（✏️），点击弹出 `CollaborativeEntry` 编辑模式，回填该场次已有玩家积分数据
- **删除**：展开态底部添加"删除场次"按钮（🗑️），点击弹出二次确认弹窗（`AlertDialog`），确认后调用 `DELETE /api/sessions`（已有接口，见 api-contracts.md 第2节），成功后刷新场次列表

**数据流**：
```
编辑: SessionCard 展开 → 点击"编辑" → 从 store 读取该场次 records
    → 传给 CollaborativeEntry (编辑模式) → 修改后 PUT /api/sessions 更新 → 刷新列表

删除: 点击"删除" → AlertDialog 确认 → DELETE /api/sessions → 刷新列表 → Toast 反馈
```

**边界处理**：
- 编辑模式下零和校验逻辑复用 `CollaborativeEntry` 已有逻辑
- 删除时若场次已有确认状态（`confirmed`），在二次确认弹窗中额外提示"该场次已确认，删除后排行榜数据将被影响"
- 编辑/删除完成后均触发 `loadSessions()` 和 `loadRecords()` 刷新

### 13.2 T-702 从上赛季导入玩家列表

**方案**：
- 在新建赛季对话框（`season-manager.tsx` 或相关组件）中添加"从上赛季导入"按钮
- 点击后调用 `GET /api/poker-records?season_id={prevSeasonId}` 获取上赛季所有记录
- 前端对返回的 `records` 数组做 `player` 字段去重，得到上赛季参与过的玩家名称集合
- 将该集合填充到当前赛季的初始玩家池

**数据流**：
```
点击"导入" → 获取上赛季 seasonId（按 created_at 降序取第二个）
    → GET /api/poker-records?season_id={prevSeasonId}
    → 前端 dedup → 与当前已有玩家合并（名称去重）
    → 写入 store/本地状态
```

**边界处理**：
| 场景 | 行为 |
|------|------|
| 无上一赛季（仅1个赛季） | 按钮置灰，Tooltip 提示"暂无历史赛季" |
| 上赛季无记录 | 按钮可点击，导入后 Toast "上赛季无玩家数据" |
| 当前已有同名玩家 | 跳过不重复添加 |
| 上赛季玩家名称在当前赛季已存在但大小写不同 | 视为不同玩家（不做模糊匹配） |

### 13.3 T-703 手机端排行榜/数据表滚动指示器

**方案**：使用纯 CSS 实现渐隐遮罩，不引入 JS 交互逻辑

**实现要点**：
- 容器右侧叠加 `::after` 伪元素，`background: linear-gradient(to left, transparent, background-color)`
- 用户滚动后遮罩通过 `scroll` 事件的 CSS class 切换隐藏
- 使用 `scrollbar-width: thin` 配合移动端原生滚动条

**实现细节**：
```css
/* 滚动容器 */
.scroll-container {
  overflow-x: auto;
  mask-image: linear-gradient(to right, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 90%, transparent 100%);
}

/* 滚动到最右侧时移除遮罩 */
.scroll-container.scrolled {
  mask-image: none;
  -webkit-mask-image: none;
}
```

**覆盖范围**：
- 排行页（`ranking-page.tsx`）的龙虎榜/胜率榜表格
- 录入页（`collaborative-entry.tsx`）的积分录入表格
- 仅在移动端（`max-width: 768px`）生效

**J**：桌面端（`md:` 断点以上）不显示遮罩

### 13.4 T-704 "新建场次"按钮固定显示

**方案**：
- 按钮始终渲染在记录模块界面中，不再依赖页面状态决定显隐
- 不可用时（如无活跃赛季）按钮 `disabled` 置灰
- 点击 disabled 按钮时通过 Tooltip 或 Toast 提示具体原因

**状态映射**：
| 场景 | 按钮状态 | 提示文案 |
|------|---------|---------|
| 有活跃赛季 | 可用（正常） | - |
| 无活跃赛季 | disabled | "请先创建赛季" |
| 数据加载中 | disabled | "加载中..." |

### 13.5 T-705 快捷选人面板替代一键添加

**方案**：
- 新增独立组件 `src/components/poker/record/quick-player-panel.tsx`
- 展示所有可用玩家头像/名称，点击某个玩家即向录入表格添加该玩家的一行
- 已添加的玩家显示"已选"状态（视觉灰显 + 勾选标记 ✓）
- 面板通过"添加玩家"按钮切换显隐

**组件职责**：
```
quick-player-panel.tsx
├── Props: { availablePlayers: string[], selectedPlayers: string[], onSelect: (player: string) => void }
├── 展示: 玩家列表（可选的 avatar icon + name）
├── 交互: 点击 → onSelect(player) → 外层 CollaborativeEntry 调用 addRow(player)
├── 状态: 已选玩家用 opacity-50 + ✓ 标记
└── 布局: 在录入表格上方（替换原有"一键添加全部"按钮区域）
```

**渐进式交付**：
- v1.0（本Sprint）：点击单个玩家添加单行，面板 toggle 显隐
- v2.0（未来）：搜索过滤、多选批量添加、拖拽排序（不纳入本Sprint）

**替代关系**：
- 移除原有"一键添加全部"按钮
- 保留手动输入玩家名的输入框（向下兼容）

### 13.6 约束确认

| 约束项 | 确认结果 |
|--------|----------|
| 纯前端改动 | ✅ 是，5个任务均不涉及后端/数据库 |
| 不改后端/数据库 | ✅ 无 API 变更，无 Schema 变更 |
| 不更新 api-contracts.md | ✅ 无需修改 |
| 增量添加 | ✅ 不删除现有功能，仅在现有组件上扩展或新增组件 |
| 无新依赖 | ✅ 全部使用现有技术栈（React + shadcn/ui + Zustand + Tailwind） |
| 文件所有权 | ✅ 仅修改 `src/components/` 与 `src/stores/` 下文件（@Frontend 所有） |

### 13.7 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| **T-701 编辑积分后排行榜未同步** | 中 | 编辑完成后强制刷新 store（`loadSessions()` + `loadRecords()`），排行榜组件监听 store 变化自动重渲染 |
| **T-702 跨赛季玩家名称变更** | 低 | 按名称去重，名称不同视为不同玩家。不做模糊匹配，防止误导入 |
| **T-703 CSS 遮罩兼容性** | 低 | `mask-image` 和 `-webkit-mask-image` 双写，降级到无遮罩（不影响功能） |
| **T-705 与现有"手动输入"流程冲突** | 低 | 保留手动输入输入框，快捷面板仅作为补充入口 |

---

## 14. 赛季总结报告（Sprint 8）— 纯前端 + 混合路由

**决策**：Sprint 8 采用纯前端方案 + 新增独立路由，6 个任务（T-801 ~ T-806）均为前端改动，不涉及后端 API、数据库 Schema 或 `api-contracts.md`。

**日期**：2026-05-10
**决策人**：@Architect

### 14.1 路由架构 — SPA 到混合路由的演进

**决策**：新建 `src/app/season-report/page.tsx` 独立路由，而非在"排行"Tab 内新增子页面。

**选型对比**：

| 方案 | 决策 | 理由 |
|------|:----:|------|
| 独立路由 `/season-report` | ✅ **采纳** | 赛季报告是独立的长页面，不适合 Tab 内嵌；路由可共享链接；布局自由度更高 |
| 排行Tab内新增子页面 | ❌ 拒绝 | 页面内容过多（排行+奖项+报告），Tab 内嵌影响用户体验；URL 无法直接分享 |

**架构影响**：
```
之前：SPA 单页模式（所有内容在 page.tsx 的 Tab 切换中）
之后：SPA + 独立路由混合模式（Tab 切换 + /season-report 独立页面）
```

**Store 可用性确认**：
- 三个核心 Store（seasonStore / recordStore / settlementStore）均使用 Zustand `persist` 中间件
- 跨路由时 Store 已驻留内存，数据立即可用（无需额外 hydration）
- 直接访问 `/season-report` 时，Store 从 `persist`（localStorage）反序列化

### 14.2 数据流设计

**核心设计原则**：在 `SeasonReportClient` 中统一调用 `computeStats()`，结果通过 props 下发子组件，避免重复计算。

```
SeasonReportClient
  ├── 统一 computeStats(filteredRecords) → ComputedStats
  ├── <StatsDashboard stats={computedStats} />
  ├── <HighlightsList stats={computedStats} />
  ├── <TrendChart trendData={trendData} players={players} />
  ├── <SeasonAwards awards={computeAwards(computedStats, settlements)} />
  └── <SeasonComparison season1={stats1} season2={stats2} />
```

### 14.3 T-806 赛季对比 — computeSeasonComparison 能力不足确认

`computeSeasonComparison`（`stats-service.ts` 第 80 行）**仅返回按玩家粒度的积分对比**，不包含 T-806 要求的聚合指标（总场次、参与人数等）。

**解决方案**：在 `SeasonReportClient` 中对两赛季分别调用 `computeStats()`，手动提取聚合指标。不修改 `stats-service.ts`，不新增 API。

### 14.4 T-805 赛季颁奖 — 直接复用 computeAwards

**决策**：直接调用 `lib/stats.ts` 的 `computeAwards(stats, settlements)` 纯函数计算奖项展示，不调用 `GET /api/awards`。

**理由**：
- `computeAwards` 已是纯计算函数，无副作用
- 赛季报告需要确定性即时展示
- 降低网络依赖

### 14.5 组件目录结构新增

```
components/poker/season-report/       # 赛季总结报告模块（Sprint 8 新增）
├── season-report-client.tsx           # 客户端组件入口，统一计算
├── stats-dashboard.tsx                # T-802 数据看板
├── highlights-list.tsx                # T-803 大事记
├── trend-chart.tsx                    # T-804 积分走势图
├── season-awards.tsx                  # T-805 赛季颁奖
└── season-comparison.tsx              # T-806 赛季对比
```

### 14.6 约束确认

| 约束项 | 确认结果 |
|--------|:--------:|
| 纯前端改动 | ✅ 是，6 个任务均不涉及后端/数据库 |
| 不改后端/数据库 | ✅ 无 API 变更，无 Schema 变更 |
| 不更新 api-contracts.md | ✅ 无需修改 |
| 增量添加 | ✅ 不删除现有功能，仅在现有架构基础上扩展新路由和新组件 |
| 无新依赖 | ✅ Recharts 已有（`package.json` 确认），其余全部使用现有技术栈 |
| 文件所有权 | ✅ 仅修改 `src/app/` 与 `src/components/` 下文件（@Frontend 所有） |

### 14.7 风险评估

| 风险 | 等级 | 缓解措施 |
|------|:----:|----------|
| **混合路由模式下导航一致性受损** | 低 | 底部导航中"赛季报告"入口使用 `<Link>` 而非 `<button>`，样式与 Tab 保持一致；用户点击后离幵主页面进入独立路由 |
| **Store 数据在独立路由中过时** | 低 | 数据从 API 加载后写入 Store，Store 使用 persist；用户从主页跳转时已持有最新数据。直接访问时从 localStorage 反序列化（可接受） |
| **T-806 聚合对比数据缺失** | 低 | 手动调用两次 `computeStats()` + 提取聚合指标，无需修改基础设施 |
| **底部导航条目数超出** | 低 | 当前 5 个 Tab + 1 个 Link，共 6 项，移动端仍可接受（flex justify-around 自适应） |

---

## 15. 德扑教练模块（Sprint 9）— 架构决策

**决策**：Sprint 9 实现德扑教练功能 MVP（Phase 1），涵盖数据库 Schema、核心引擎、API 契约、前端组件四大领域。

**日期**：2026-06-03
**决策人**：@Architect

### 15.1 数据库 Schema 设计

**决策**：新增 3 张独立表（coach_sessions / coach_decisions / coach_feedback），独立于现有赛季/场次体系。

**选型对比**：

| 方案 | 决策 | 理由 |
|------|:----:|------|
| 独立 3 张新表（与现有表无 FK 关联） | ✅ **采纳** | 训练数据与比赛数据完全隔离，不影响现有功能；教练模块独立于赛季系统 |
| 复用 hand_records 表扩展 | ❌ 拒绝 | hand_records 是比赛记录，训练数据语义不同；字段差异大，扩展后表结构混乱 |
| 在 game_sessions 上加 type 字段 | ❌ 拒绝 | game_sessions 是比赛场次，与训练会话概念不同；会导致现有查询逻辑复杂化 |

**关键设计**：
- `coach_decisions` 和 `coach_feedback` 使用 `ON DELETE CASCADE`，删除会话时级联清理
- `hole_cards` 和 `board_cards` 存储为 JSON 字符串（与现有 hand_records.actions 一致）
- `gto_recommendation` 和 `gto_frequency` 可为 null（Postflop 阶段可能无精确 GTO 数据）

### 15.2 核心引擎架构

**决策**：采用 5 个独立引擎模块，各司其职，通过 coachService 统一编排。

**引擎职责分离**：

| 引擎 | 文件 | 依赖 | 是否离线可用 |
|------|------|:----:|:-----------:|
| OddsCalculator | equity-engine.ts | poker-odds-calculator | ✅ 是 |
| GTORangeTable | gto-engine.ts | preflop-ranges.json | ✅ 是 |
| PostflopStrategy | postflop-strategy.ts | hand-rankings.json | ✅ 是 |
| DecisionEvaluator | feedback-engine.ts | 无 | ✅ 是 |
| OpponentEngine | opponent-engine.ts | GTORangeTable + PostflopStrategy | ✅ 是 |

**设计原则**：
- 所有引擎均为纯函数，无副作用，便于测试
- 所有引擎在浏览器端和服务端均可运行（同构）
- 预计算数据（JSON 文件）打包到前端 bundle，确保离线可用

### 15.3 Preflop GTO 范围 — 预计算 JSON 方案

**决策**：使用预计算 JSON 文件 + 内存查询，而非运行时动态计算。

**选型对比**：

| 方案 | 决策 | 理由 |
|------|:----:|------|
| 预计算 JSON + 内存查询 | ✅ **采纳** | 查询性能 < 10ms，完全离线可用，数据可人工校验和调整 |
| 运行时动态计算（Nash Solver） | ❌ 拒绝 | 计算复杂（需迭代求解），浏览器端性能不可控，依赖重 |
| 调用外部 API | ❌ 拒绝 | 需网络连接，与离线可用目标矛盾 |

**数据生成**：
- 使用 `bitval` npm 包辅助生成范围表 [HUMAN-REVIEW:NEW-DEPENDENCY]
- 参考 GTO Wizard 公开数据交叉验证
- 生成脚本 `preflop-ranges-generator.ts` 可独立运行，输出 JSON 文件

### 15.4 Postflop 策略 — 简化启发式规则

**决策**：Phase 1 使用基于手牌强度分级的启发式规则，不追求 Nash Equilibrium 精确解。

**选型对比**：

| 方案 | 决策 | 理由 |
|------|:----:|------|
| 简化启发式规则（5级手牌强度） | ✅ **采纳** | 实现简单（~200行），性能好，MVP 够用 |
| 查表法（预计算所有 Flop 场景） | ❌ 拒绝 | Flop 组合数巨大（C(52,5)=260万），JSON 文件过大 |
| 轻量级 Solver（如 OpenSpiel） | ❌ 拒绝 | 依赖重，浏览器端运行不可控 |

**手牌强度评估**：
- 使用 `bitval` 辅助评估手牌价值 [HUMAN-REVIEW:NEW-DEPENDENCY]
- 考虑：底牌组合、公共牌结构、同花/顺子听牌可能性
- 返回 5 级强度（Nut / Top Pair+ / Middle Pair / Draw / Weak）

### 15.5 API 设计 — RESTful 风格

**决策**：采用 RESTful 风格，以 `/api/coach/sessions/:id` 为核心资源路径。

**路由设计**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/coach/sessions | 创建会话 |
| GET | /api/coach/sessions | 会话列表 |
| GET | /api/coach/sessions/:id | 会话详情（含决策） |
| POST | /api/coach/sessions/:id/decisions | 记录决策（含 GTO 反馈） |
| GET | /api/coach/sessions/:id/advice | 实时 GTO 建议 |
| POST | /api/coach/sessions/:id/complete | 完成/放弃会话 |
| GET | /api/coach/sessions/:id/review | 复盘报告 |
| GET | /api/coach/gtoranges | GTO 范围表 |
| POST | /api/coach/equity | 赔率计算 |

**设计理由**：
- `POST /api/coach/sessions/:id/decisions` 同时完成"记录决策 + 计算 GTO 反馈 + 生成对手响应"三个动作，减少网络往返
- `GET /api/coach/sessions/:id/advice` 是只读查询，不保存数据，用于训练中的实时提示
- `POST /api/coach/sessions/:id/complete` 使用 `action` 字段区分"完成"和"放弃"，避免两个独立端点

### 15.6 前端路由设计

**决策**：采用独立路由（与赛季报告一致），而非 Tab 内嵌。

**路由结构**：

| 路由 | 页面 | 说明 |
|------|------|------|
| `/coach` | 教练中心首页 | 训练历史、快捷开始、统计概览 |
| `/coach/training` | 训练桌面 | 核心训练交互页面 |
| `/coach/review/:sessionId` | 赛后复盘 | 单次训练的复盘报告 |

**设计理由**：
- 训练桌面是全屏交互页面，不适合 Tab 内嵌
- 复盘页面需要 URL 可分享
- 与 Sprint 8 赛季报告的混合路由模式一致

### 15.7 组件架构 — Zustand Store + 客户端状态

**决策**：训练桌面使用 `coachStore`（Zustand）管理实时训练状态，通过 API 持久化。

**状态分层**：

| 层级 | 存储位置 | 说明 |
|------|----------|------|
| 实时训练状态（当前手牌、底池、筹码） | coachStore（内存） | 高频更新，不持久化 |
| 决策记录 | API → SQLite | 每次决策后持久化 |
| 会话元数据 | API → SQLite | 创建/完成时持久化 |
| GTO 范围表 | 静态 JSON（bundle） | 预加载到内存 |

**coachStore 核心状态**：
```typescript
interface CoachStoreState {
  currentSession: CoachSession | null
  decisions: CoachDecision[]
  handNumber: number
  street: Street
  potSize: number
  userStack: number
  opponentStack: number
  holeCards: string[]
  boardCards: string[]
  isWaitingForOpponent: boolean
}
```

### 15.8 约束确认

| 约束项 | 确认结果 |
|--------|:--------:|
| 新依赖引入 | ⚠️ `poker-odds-calculator` + `bitval` 需 [HUMAN-REVIEW:NEW-DEPENDENCY] |
| 数据库变更 | ✅ 新增 3 张表，不修改现有表 |
| 离线可用 | ✅ 核心训练功能完全离线，GTO 范围表预加载 |
| 纯函数引擎 | ✅ 5 个引擎均为纯函数，无副作用 |
| 文件所有权 | ✅ @Backend: schema/engine/API；@Frontend: component/store |

### 15.9 风险评估

| 风险 | 等级 | 缓解措施 |
|------|:----:|----------|
| **poker-odds-calculator 集成复杂度** | 中 | 先在独立测试文件中验证 API，确认可行后再集成到引擎 |
| **Preflop GTO 范围数据准确性** | 中 | 参考多个公开来源（GTO Wizard / PokerSnowie），使用 bitval 交叉验证 |
| **Postflop 简化策略过于简化** | 中 | Phase 1 接受简化；Phase 2 可升级为更精确的查表法或轻量级 Solver |
| **训练桌面 UI 复杂度** | 中 | 先实现无动画的静态版本，Phase 2 再添加过渡动画 |
| **新依赖安全风险** | 低 | 使用 `pnpm audit` 检查，选择维护活跃的版本 |

---

## 16. 未来决策（待定）

| 决策项 | 状态 | 说明 |
|--------|------|------|
| Tauri桌面端 | 待评估 | 可能引入 |
| React Native移动端 | 待评估 | 可能引入 |
| 云端同步 | v2.0 | 可选功能 |
| Postflop 精确 GTO | Phase 2 | 升级查表法或轻量级 Solver |
| Tournament 模式 | Phase 3 | 盲注上涨 + 奖池结构 |
| 真实手牌复盘 | Phase 3 | 从 hand_records 导入复盘 |
| Coze AI 自然语言总结 | Phase 3 | 调用 AI 做复盘总结 |

---

## 17. 版本历史

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 2026-06-03 | 1.7 | 新增第15节"德扑教练模块（Sprint 9）"：数据库 Schema 决策（15.1）、核心引擎架构（15.2）、Preflop GTO 预计算方案（15.3）、Postflop 简化策略（15.4）、RESTful API 设计（15.5）、前端路由设计（15.6）、组件架构 Zusand Store（15.7）、约束确认（15.8）、风险评估（15.9） | @Architect |
| 2026-05-10 | 1.6 | 新增第14节"Sprint 8 赛季总结报告"：混合路由决策、数据流设计、组件目录新增、约束确认、风险评估 | @Architect |
| 2026-05-06 | 1.5 | 新增第13节"Sprint 7 体验优化·第二阶段"：5个纯前端任务决策记录（T-701~T-705） | @Architect |
| 2026-05-05 | 1.4 | 新增第12节"整体前端重构（Sprint 6）— 纯前端体验优化"，记录 8 个任务的实施方案和关键决策 | @Architect |
| 2026-05-05 | 1.3 | 新增第11节"录入积分界面优化 — 纯前端增量方案" | @Architect |
| 2026-05-05 | 1.2 | 新增第10节"AI配置策略决策"：配置自定义方案（10.1）、安全约束（10.2）、coze SDK兼容策略（10.3） | @Architect |
| 2026-05-05 | 1.1 | 新增"测试策略决策"章节（第9节），记录Vitest/Playwright选型及测试覆盖策略 | @Architect |
| 2026-05-05 | 1.0 | 初始版本 | @Architect |

---

*本文档由 @Architect 维护*
*最后更新：2026-06-03（v1.7 Sprint 9 德扑教练模块）*
