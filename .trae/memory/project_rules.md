# 项目规则 · Poker Tracker

> ⚠️ **所有Agent每次任务开始前必须读取本文件**

**版本**: 1.0
**日期**: 2026-05-05
**状态**: 正式版

---

## [CRITICAL] 文件所有权（禁止越界写入）

| 目录/文件 | 所有者 | 其他Agent权限 |
|-----------|--------|--------------|
| `src/components/`, `src/app/`（不含api） | @Frontend | 只读 |
| `src/app/api/`, `src/services/`, `src/storage/` | @Backend | 只读 |
| `src/stores/` | @Backend | 只读 |
| `src/__tests__/` | @QA | 只读 |
| `src/lib/types.ts`, `src/lib/constants.ts` | @Architect | 只读 |
| `.trae/memory/api-contracts.md` | @Backend写 | 全员只读 |
| `.trae/memory/architecture.md` | @Architect写 | 全员只读 |
| `.trae/memory/current-sprint.md` | @PM写 | 全员只读 |
| `.trae/memory/handover.md` | 全员 | 全员读写 |
| `.trae/memory/tech-debt.md` | 全员 | 全员读写 |
| `.trae/memory/decisions.md` | @Architect写 | 全员只读 |

**违反所有权 = 任务失败，必须回滚并通知@PM。**

---

## [CRITICAL] 记忆文件维护归属

| 文件 | 维护责任人 | 定期审查事项 |
|------|-----------|-------------|
| `project_rules.md` | @Architect | 全局规则对齐、所有权变更 |
| `architecture.md` | @Architect | 技术栈变更、ER图、模块架构 |
| `api-contracts.md` | @Backend | API签名变更、响应格式 |
| `current-sprint.md` | @PM | 冲刺进度、任务看板更新 |
| `handover.md` | 全员（@SOLO Coder牵头） | 目录结构、组件状态、已知问题 |
| `tech-debt.md` | 全员（@Architect审核） | 债务项状态变更、新债务录入 |
| `decisions.md` | @Architect | 新增技术决策记录 |

---

## [CRITICAL] SOP流水线顺序

需求必须按以下顺序流转，禁止跳步：

```
用户需求
  ↓ @PM 拆解 → current-sprint.md
  ↓ @Architect 设计 → architecture.md + api-contracts.md
  ↓ @Backend 实现API → src/app/api/, src/services/
  ↓ @Frontend 实现UI → src/components/, src/app/
  ↓ @QA 测试覆盖 → src/__tests__/
  ↓ @DevOps 部署检查 → CI/CD
```

@Backend和@Frontend可以并行，前提是@Architect已完成接口契约。

---

## [CRITICAL] 强制结构化产出

每个角色必须产出规定格式的文档，后续角色依赖这些文档工作：

| 角色 | 产出物 | 说明 |
|------|--------|------|
| @PM | `current-sprint.md` | 任务表格，包含ID/名称/优先级/负责人/工时 |
| @Architect | `architecture.md`更新 + `api-contracts.md`接口定义 | 含ER图、数据流、API契约 |
| @Backend | 实现代码 + 更新`handover.md` | API Routes / Service / Storage |
| @Frontend | 实现代码 + 更新`handover.md` | 组件 / 页面 / Store对接 |
| @QA | 测试报告到`handover.md` | 测试覆盖结果、Bug列表 |
| @DevOps | 部署状态到`handover.md` | CI/CD状态、环境配置 |

---

## [IMPORTANT] 技术栈约束

| 层级 | 技术选型 |
|------|----------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5（strict模式） |
| UI组件 | shadcn/ui (基于 Radix UI) |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 后端 | Next.js Route Handlers |
| 数据库 | SQLite（文件 `data/poker-tracker.db`） |
| ORM | Drizzle ORM |
| 图表 | Recharts |
| AI | coze-coding-dev-sdk（SSE流式） |
| 测试 | Vitest（单元）+ Playwright（E2E，规划中） |
| 包管理 | pnpm |

**禁用清单**：jQuery | class组件 | any类型 | 未经@Architect批准的新依赖

---

## [IMPORTANT] 接口规范

### URL格式

```
/api/{resource}[/{action}]
```

示例：
- `GET /api/seasons` — 获取赛季列表
- `POST /api/tencent-docs` — 腾讯文档导入
- `GET /api/seasons?id=xxx` — 按ID查询

### 响应格式

```typescript
// 成功
{ success: true, data: T | null, error: null }

// 错误
{ success: false, data: null, error: string }
```

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| `200` | 成功 |
| `400` | 参数错误 |
| `404` | 资源不存在 |
| `500` | 服务器错误 |

### 分页规范

所有列表接口必须支持 `?page=&limit=`。

```typescript
// 分页响应
{
  success: true,
  data: {
    items: T[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### SSE流式接口

AI分析使用 Server-Sent Events：

```
data: {"type":"content","content":"分析中..."}
data: {"type":"done"}
data: {"type":"error","error":"错误信息"}
```

---

## [IMPORTANT] Git规范

- **commit格式**：`type(scope): description`（中文description可以）
- **type枚举**：feat | fix | refactor | test | docs | chore
- **PR合并前**：必须有测试 + @QA review标记

---

## [IMPORTANT] 人工介入触发条件

以下操作执行前必须停下，更新handover.md并等待人工确认：

- ❌ 删除数据库表或字段（db-migration）
- ❌ 变更已发布API签名
- ❌ 引入新的第三方npm包
- ❌ 修改CI/CD流程
- ❌ 涉及支付/鉴权的代码

---

## [OPTIONAL] 代码风格

| 规则 | 说明 |
|------|------|
| 函数大小 | 不超过50行（超出必须拆分） |
| 文件大小 | 不超过300行（超出必须拆分） |
| 注释规范 | 公共函数必须有JSDoc注释，说明"为什么"而非"是什么" |
| 错误处理 | 所有async函数必须有try/catch或统一错误处理 |
| 类型约束 | 禁止使用 `any` 类型 |
| TODO约束 | 不留TODO注释，要么立刻实现，要么记录到tech-debt.md |
| 数据库操作 | 只在service层操作DB，禁止在controller或route直接查DB |

---

## 项目目录结构

```
poker-tracker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes（后端）
│   │   ├── page.tsx          # 首页
│   │   ├── layout.tsx        # 布局
│   │   ├── globals.css       # 全局样式
│   │   └── robots.ts         # robots配置
│   ├── components/
│   │   ├── poker/            # 业务组件
│   │   │   ├── home/         # 首页模块
│   │   │   ├── record/       # 记录模块
│   │   │   ├── ranking/      # 排行模块
│   │   │   ├── hand/         # 手牌模块
│   │   │   ├── season/       # 赛季模块
│   │   │   ├── share/        # 分享模块
│   │   │   ├── player/       # 玩家模块
│   │   │   ├── profile/      # 个人中心模块
│   │   │   ├── ai/           # AI分析模块
│   │   │   └── common/       # 公共组件
│   │   └── ui/               # shadcn/ui组件库
│   ├── services/             # 业务逻辑层（8个）
│   ├── storage/
│   │   └── database/         # 数据访问层
│   │       ├── shared/       # Schema和关系
│   │       ├── crud.ts       # CRUD操作
│   │       ├── drizzle.ts    # 数据库连接
│   │       └── seed.ts       # 种子数据
│   ├── stores/               # Zustand状态管理（5个）
│   ├── lib/                  # 工具库
│   │   ├── types.ts          # 类型定义
│   │   ├── constants.ts      # 常量
│   │   ├── utils.ts          # 工具函数
│   │   ├── data.ts           # 数据处理
│   │   ├── stats.ts          # 统计计算
│   │   ├── seed-seasons.ts   # 赛季种子数据
│   │   └── seed-records.ts   # 记录种子数据
│   ├── hooks/                # React Hooks
│   ├── __tests__/            # 测试文件
│   └── server.ts             # 服务器配置
├── data/                     # SQLite数据库文件
├── .trae/
│   └── memory/               # SOP文档
│       ├── project_rules.md  # 本文件
│       ├── architecture.md  # 架构文档
│       ├── api-contracts.md  # API契约
│       ├── current-sprint.md # 当前冲刺
│       ├── handover.md      # 交接文档
│       ├── tech-debt.md     # 技术债务
│       └── decisions.md      # 技术决策
└── PRD.md                   # 产品需求文档
```

---

## 数据库Schema所有权

| 表名 | 描述 | 管理职责 |
|------|------|----------|
| seasons | 赛季表 | @Backend |
| game_sessions | 场次表 | @Backend |
| poker_records | 比赛记录表 | @Backend |
| player_settlements | 玩家结算表 | @Backend |
| clear_records | 清分记录表 | @Backend |
| hand_records | 手牌记录表 | @Backend |
| award_records | 奖项记录表 | @Backend |
| ai_cache | AI缓存表 | @Backend |

**注意**：任何数据库变更必须通过 @Architect 评审，并记录到 decisions.md。

---

*文档版本：1.0 | 最后更新：2026-05-05*
