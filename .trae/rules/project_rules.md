---
alwaysApply: true
---

# Poker Tracker 项目规则

> ⚠️ **所有 Agent 每次任务开始前必须读取本文件**

**版本**: 2.0（多智能体协作体系）
**日期**: 2026-05-22
**状态**: 正式版

---

## 团队阵容

SOLO Coder 是总指挥，只规划调度，不编写实现代码。

| 标识 | 角色 | 核心职责 |
|------|------|----------|
| `SOLO Coder` | 总指挥 | 判断任务类型、输出路由计划、委派子Agent、最终审查 |
| `pm` | 产品经理 | 需求澄清、PRD输出、任务拆解、Sprint规划 |
| `architect` | 系统架构师 | 技术方案设计、架构决策、架构文档维护、代码审查 |
| `backend-developer` | 后端工程师 | API实现、Service层、数据库操作、api-contracts维护 |
| `frontend-developer` | 前端工程师 | UI组件开发、页面实现、Store对接 |
| `qa-engineer` | 测试工程师 | 全量穷举测试、Bug复现、回归验证、质量把关 |
| `devops-engineer` | 运维工程师 | 部署、环境问题、CI/CD配置 |
| `solution-consultant` | 解决方案顾问 | 需求诊断、问题分诊、方案评审、Sprint协调 |
| `technical-researcher` | 技术调研员 | 外部信息搜索、对比选型、可行性分析 |
| `writing-expert` | 写作专家 | 文档撰写（PRD/API/用户手册/发布说明） |
| `obsidian-km` | 知识库管理员 | 项目记忆持久化、经验沉淀到Obsidian |

---

## 文件所有权（禁止越界写入）

| 目录/文件 | 所有者 | 其他Agent权限 |
|-----------|--------|--------------|
| `src/components/`, `src/app/`（不含api） | @frontend-developer | 只读 |
| `src/app/api/`, `src/services/`, `src/storage/` | @backend-developer | 只读 |
| `src/stores/` | @backend-developer | 只读 |
| `src/__tests__/` | @qa-engineer | 只读 |
| `src/lib/types.ts`, `src/lib/constants.ts` | @architect | 只读 |
| `.trae/memory/api-contracts.md` | @backend-developer写 | 全员只读 |
| `.trae/memory/architecture.md` | @architect写 | 全员只读 |
| `.trae/memory/current-sprint.md` | @pm写 | 全员只读 |
| `.trae/memory/handover.md` | 全员 | 全员读写 |
| `.trae/memory/tech-debt.md` | 全员 | 全员读写 |
| `.trae/memory/decisions.md` | @architect写 | 全员只读 |
| `.trae/rules/project_rules.md` | @solution-consultant决策 + @writing-expert执行 | 其他角色只读 |
| `AGENTS.md` | @solution-consultant决策 + @writing-expert执行 | 其他角色只读 |

**违反所有权 = 任务失败，必须回滚并通知@pm。**

---

## 记忆文件维护归属

| 文件 | 维护责任人 | 定期审查事项 |
|------|-----------|-------------|
| `project_rules.md`（本文件） | @solution-consultant + @writing-expert | 全局规则对齐、所有权变更 |
| `architecture.md` | @architect | 技术栈变更、ER图、模块架构 |
| `api-contracts.md` | @backend-developer | API签名变更、响应格式 |
| `current-sprint.md` | @pm | 冲刺进度、任务看板更新 |
| `handover.md` | 全员（@SOLO Coder牵头） | 目录结构、组件状态、已知问题 |
| `tech-debt.md` | 全员（@architect审核） | 债务项状态变更、新债务录入 |
| `decisions.md` | @architect | 新增技术决策记录 |
| `AGENTS.md` | @solution-consultant + @writing-expert | 智能体名单、命令、业务规则 |

---

## SOP 流水线顺序

需求必须按以下顺序流转，禁止跳步：

```
用户需求
  ↓ @pm 拆解 → current-sprint.md
  ↓ @architect 设计 → architecture.md + api-contracts.md
  ↓ @backend-developer 实现API → src/app/api/, src/services/
  ↓ @frontend-developer 实现UI → src/components/, src/app/
  ↓ @qa-engineer 测试覆盖 → src/__tests__/
  ↓ @devops-engineer 部署检查 → CI/CD
```

@backend-developer 和 @frontend-developer 可以并行，前提是 @architect 已完成接口契约。

### 各场景调度序列速查

| 场景 | 序列 |
|------|------|
| 新功能需求 | pm → architect → [backend+frontend并行] → qa → writing-expert |
| 修复Bug | qa(定位) → developer(修复) → qa(验证) → writing-expert |
| 接口变更 | architect → backend → frontend → qa → writing-expert |
| 性能优化 | architect → backend → qa(基准测试) → writing-expert |
| 部署上线 | qa(确认) → devops → writing-expert |
| 数据库变更 | architect → backend(migration) → qa(验证) → writing-expert |
| 技术调研 | technical-researcher → architect(评审) → writing-expert |
| 卡点攻关 | solution-consultant(诊断) → technical-researcher(调研) → solution-consultant(评审) |
| Sprint复盘 | solution-consultant → writing-expert(创建/更新Skill) → obsidian-km(归档) |

---

## 技能体系

| 技能 | 使用者 | 用途 |
|------|--------|------|
| `team-sop` | ALL | 协作总纲，每次任务前必读 |
| `requirements-clarification` | pm, solution-consultant | 需求澄清、输出PRD文档 |
| `task-breakdown` | pm | 任务拆解、Sprint规划 |
| `solution-planning` | pm, architect, solution-consultant | 分阶段实施路线图 |
| `open-source-research` | technical-researcher | GitHub开源项目搜索、筛选、评估 |
| `tech-selection` | technical-researcher, architect | 技术框架/工具对比选型 |
| `feasibility-assessment` | ALL | 评估技术方案可行性和风险 |
| `frontend-component` | frontend-developer | React/Next.js组件开发 |
| `web-dev` | frontend-developer | 全栈网页开发（含UI/CSS/交互） |
| `db-migration` | backend-developer | Prisma Schema变更 + Migration |
| `api-design` | architect | RESTful API接口设计 |
| `write-tests` | qa-engineer | 标准化测试流程（回归/验收/Bug复现/E2E） |
| `playwright-cli` | qa-engineer（测试）, technical-researcher（数据抓取） | 浏览器自动化操作 |
| `code-review` | ALL | 安全/性能/规范代码审查 |
| `writing-expert` | writing-expert | 文档撰写（PRD/API文档/用户手册/发布说明） |
| `deploy-check` | devops-engineer, backend-developer | 部署前检查清单、上线验证 |
| `skill-creator` | ALL | 创建新Skill文件 |
| `multi-agent-blueprint` | ALL | 多智能体体系搭建蓝图（新项目启动时） |
| `obsidian-km` | obsidian-km | Obsidian知识库管理 |

---

## 强制结构化产出

每个角色必须产出规定格式的文档，后续角色依赖这些文档工作：

| 角色 | 产出物 | 说明 |
|------|--------|------|
| @pm | `current-sprint.md` | 任务表格，包含ID/名称/优先级/负责人/工时 |
| @architect | `architecture.md`更新 + `api-contracts.md`接口定义 | 含ER图、数据流、API契约 |
| @backend-developer | 实现代码 + 更新 `handover.md` | API Routes / Service / Storage |
| @frontend-developer | 实现代码 + 更新 `handover.md` | 组件 / 页面 / Store对接 |
| @qa-engineer | 测试报告到 `handover.md` | 测试覆盖结果、Bug列表 |
| @devops-engineer | 部署状态到 `handover.md` | CI/CD状态、环境配置 |

---

## SOLO Coder 路由计划输出规范

每次收到用户请求时输出路由计划：
```
【路由计划】场景：[新功能/Bug修复/调研/...]
Step1 → @pm 需求拆解
Step2 → @architect 技术方案
Step3 → @frontend-developer 实现（涉及文件列表）
Step4 → @qa-engineer 验证
```

---

## QA-FINDING 分流机制

QA测试中发现的任何问题标记 `[QA-FINDING:类型]`，**不直接修复**，提交分流：

| 标记 | 含义 | 分流去向 |
|------|------|---------|
| `[QA-FINDING:DESIGN]` | 产品设计不合理 | → 产品需求评审 |
| `[QA-FINDING:BUG]` | 未按开发要求实现 | → Bug修复流程 |
| `[QA-FINDING:DEBT]` | 技术债务 | → tech-debt.md |

---

## 文件写入安全规则（防清空）

1. Write工具只用于新建文件，禁止修改现有文件
2. 现有文件的修改用 SearchReplace 做局部替换
3. 修改前必须先 Read 确认文件内容
4. 修改后立即 Read 前5行验证文件非空
5. 大文件（>1000行）修改前 git stash 备份
6. 文件被意外清空时：git checkout -- <文件路径>（禁止手动重写）

---

## 技术栈约束

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

**禁用清单**：jQuery | class组件 | any类型 | 未经@architect批准的新依赖

---

## 接口规范

### URL格式

```
/api/{resource}[/{action}]
```

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

## Git规范

- **commit格式**：`type(scope): description`（中文description可以）
- **type枚举**：feat | fix | refactor | test | docs | chore
- **PR合并前**：必须有测试 + @qa-engineer review标记

---

## 人工确认操作（[HUMAN-REVIEW]）

以下操作执行前必须停下，更新handover.md并等待人工确认：

| 操作 | 标记 | 风险 |
|------|------|------|
| 删除数据库表或字段 | `[HUMAN-REVIEW:DB-DROP]` | 数据丢失 |
| 修改已发布API签名 | `[HUMAN-REVIEW:API-BREAKING]` | 破坏已有集成 |
| 引入新npm依赖 | `[HUMAN-REVIEW:NEW-DEPENDENCY]` | 安全风险 |
| 修改CI/CD配置 | `[HUMAN-REVIEW:CI-CD-CHANGE]` | 构建失败 |
| 涉及支付或鉴权 | `[HUMAN-REVIEW:PAYMENT-AUTH]` | 安全风险 |
| 生产环境部署 | `[HUMAN-REVIEW:PROD-DEPLOY]` | 全局影响 |

---

## 代码风格

| 规则 | 说明 |
|------|------|
| 函数大小 | 不超过50行（超出必须拆分） |
| 文件大小 | 不超过300行（超出必须拆分） |
| 注释规范 | 注释说明"为什么"而非"是什么"，使用中文 |
| 错误处理 | 所有async函数必须有try/catch或统一错误处理 |
| 类型约束 | 禁止使用 `any` 类型 |
| TODO约束 | 不留TODO注释，要么立刻实现，要么记录到tech-debt.md |
| 数据库操作 | 只在service层操作DB，禁止在controller或route直接查DB |
| 变量/函数/类名 | 使用英文命名 |

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
│   │   │   ├── season-report/ # 赛季总结报告模块
│   │   │   ├── share/        # 分享模块
│   │   │   ├── player/       # 玩家模块
│   │   │   ├── profile/      # 个人中心模块
│   │   │   ├── ai/           # AI分析模块
│   │   │   └── common/       # 公共组件
│   │   └── ui/               # shadcn/ui组件库
│   ├── services/             # 业务逻辑层
│   ├── storage/
│   │   └── database/         # 数据访问层
│   │       ├── shared/       # Schema和关系
│   │       ├── crud.ts       # CRUD操作
│   │       ├── drizzle.ts    # 数据库连接
│   │       └── seed.ts       # 种子数据
│   ├── stores/               # Zustand状态管理
│   ├── lib/                  # 工具库
│   │   ├── types.ts          # 类型定义
│   │   ├── constants.ts      # 常量
│   │   ├── utils.ts          # 工具函数
│   │   ├── data.ts           # 数据处理
│   │   ├── stats.ts          # 统计计算
│   │   └── ...
│   ├── hooks/                # React Hooks
│   ├── __tests__/            # 测试文件
│   └── server.ts             # 服务器配置
├── data/                     # SQLite数据库文件
├── AGENTS.md                 # 智能体名片
└── .trae/
    ├── .ignore
    ├── rules/
    │   └── project_rules.md  # 本文件
    ├── memory/               # SOP记忆文档
    └── specs/                # 功能规格

```

---

## 数据库Schema所有权

| 表名 | 描述 | 管理职责 |
|------|------|----------|
| seasons | 赛季表 | @backend-developer |
| game_sessions | 场次表 | @backend-developer |
| poker_records | 比赛记录表 | @backend-developer |
| player_settlements | 玩家结算表 | @backend-developer |
| clear_records | 清分记录表 | @backend-developer |
| hand_records | 手牌记录表 | @backend-developer |
| award_records | 奖项记录表 | @backend-developer |
| ai_cache | AI缓存表 | @backend-developer |

**注意**：任何数据库变更必须通过 @architect 评审，并记录到 decisions.md。

---

*文档版本：2.0（多智能体协作体系） | 最后更新：2026-05-22*