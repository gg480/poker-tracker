# 德扑积分榜 (Poker Tracker) 系统架构设计文档

**版本**: 1.0
**日期**: 2026-04-26
**基于**: PRD v3.0

---

## 1. 当前代码评审结论

### 1.1 技术栈现状

| 层级 | 当前实现 | PRD要求 | 差距 |
|------|----------|---------|------|
| 框架 | Next.js 16 (App Router) | Tauri 2.0 / React Native | 需引入Tauri包装 |
| 前端 | React 19 + TypeScript 5 | React + TypeScript | 一致 |
| UI组件 | shadcn/ui (Radix UI) | shadcn/ui | 一致 |
| 样式 | Tailwind CSS 4 | Tailwind CSS | 一致 |
| 状态管理 | React useState (page.tsx) | Zustand | 需引入Zustand |
| 数据库 | Supabase (PostgreSQL) + localStorage | SQLite (本地优先) | 需替换存储层 |
| ORM | Drizzle ORM (pgTable, 未实际使用) | better-sqlite3 / sql.js | 需重写schema |
| 图表 | Recharts | Recharts / ECharts | 一致 |
| AI分析 | coze-coding-dev-sdk (SSE) | LLM API | 一致 |
| 分享 | 无 | html2canvas | 需新增 |

### 1.2 现有功能模块评估

| 模块 | 文件 | 完成度 | 评审结论 |
|------|------|--------|----------|
| 总览面板 | dashboard.tsx | 80% | 可复用，需增加清分雷达预警区 |
| 录入面板 | record-entry.tsx | 40% | 需重构为多人协作录入模式 |
| 奖项面板 | awards.tsx | 60% | 可复用，需扩展至PRD定义的16+奖项 |
| 玩家详情 | player-view.tsx | 70% | 可复用，需增加穿透分析 |
| 赛季管理 | season-manager.tsx | 65% | 可复用，需完善封存/新建赛季流程 |
| AI分析 | ai-analysis.tsx | 85% | 可复用，质量较高 |
| 数据层 | data.ts | 50% | 需重构，移除Supabase依赖，改用SQLite |
| 统计计算 | stats.ts | 80% | 可复用，核心算法成熟 |

### 1.3 核心问题清单

**P0 - 架构级问题**:

1. **存储层混乱**: Supabase(云端) + localStorage(本地) 双写，降级逻辑复杂，数据一致性无保障。PRD要求本地优先，当前架构与产品定位矛盾。
2. **无场次概念**: 当前数据模型只有 `PokerRecord`(date+player+score)，缺少 `GameSession` 实体。无法支持多人协作录入的状态追踪(pending/collected/confirmed)。
3. **状态管理膨胀**: page.tsx 承载了全部状态(300+行)，包括数据加载、赛季过滤、清分逻辑、Tab切换等，违反单一职责原则。
4. **Drizzle ORM 未启用**: schema.ts 使用 pgTable 定义了 PostgreSQL 表结构，但实际查询全部走 Supabase 客户端，Drizzle 形同虚设。

**P1 - 功能缺失**:

5. **无分享功能**: PRD P0要求"一键生成分享图片"，当前完全缺失。
6. **无清分雷达**: PRD P0要求智能预警(80%/100%/催办)，当前仅有简单的阈值判断UI。
7. **无手牌记录**: PRD P1要求手牌记录模块，当前完全缺失。
8. **无腾讯文档集成**: PRD P1要求，当前仅有技术方案文档，无代码实现。
9. **无JSON导入导出**: PRD P0要求，当前缺失。

**P2 - 代码质量**:

10. **CRUD重复**: `supabase/crud.ts`(客户端) 和 `crud-server.ts`(服务端) 存在大量重复的CRUD函数。
11. **种子数据硬编码**: 700+行种子数据直接写在 data.ts 中，应迁移到数据库初始化脚本。
12. **类型不一致**: 前端 `PokerRecord` 无 id 字段，数据库 `pokerRecords` 有 serial id，映射时丢失。

---

## 2. 目标架构设计

### 2.1 技术选型决策

| 决策项 | 选型 | 理由 |
|--------|------|------|
| 跨平台框架 | **Tauri 2.0 + Next.js** | 保留现有Next.js代码资产，Tauri提供原生能力(文件系统/通知/截图)，比Electron更轻量(安装包<10MB vs >100MB) |
| 本地数据库 | **better-sqlite3** | 同步API、性能优异(10万条记录<50ms查询)、零配置、Tauri侧可用；sql.js作为浏览器降级方案 |
| 状态管理 | **Zustand** | 轻量(1KB)、无boilerplate、支持中间件(persist/devtools)、与React解耦、PRD明确指定 |
| ORM | **Drizzle ORM (SQLite)** | 类型安全、轻量、已有schema定义习惯，从pgTable迁移到sqliteTable成本低 |
| 分享截图 | **html2canvas** | 纯前端实现、无服务端依赖、社区成熟、与Tauri兼容 |
| 图表 | **Recharts** (保留) | 已有大量使用、团队熟悉、满足需求 |
| 包管理 | **pnpm** | 已有规范、磁盘效率高 |

**关键决策说明 - 为什么选择Tauri而非纯Web**:

- PRD明确要求"跨平台App"，纯Web无法满足离线优先和数据主权需求
- Tauri 2.0支持iOS/Android/Windows/macOS/Linux，一套代码五端运行
- Tauri的Rust后端可直接操作SQLite，避免Node.js原生模块兼容问题
- 渐进式迁移：先保持Next.js开发模式，Tauri仅作为构建目标

### 2.2 模块架构图

```
+================================================================+
|                        Poker Tracker App                        |
+================================================================+
|                                                                 |
|  +-------------------+  +-------------------+  +--------------+ |
|  |   Presentation    |  |    Application    |  |  Infrastructure| |
|  |     Layer         |  |      Layer        |  |     Layer      | |
|  +-------------------+  +-------------------+  +--------------+ |
|  |                    |  |                    |  |               | |
|  | Pages/             |  | Zustand Stores    |  | SQLite DB     | |
|  |  - HomePage        |  |  - recordStore    |  | Drizzle ORM   | |
|  |  - RecordPage      |  |  - seasonStore    |  | Tauri IPC     | |
|  |  - RankingPage     |  |  - settlementStore|  | File System   | |
|  |  - HandPage        |  |  - uiStore        |  | Share Engine  | |
|  |  - ProfilePage     |  |                    |  | Import/Export | |
|  |                    |  | Services           |  | Tencent Docs  | |
|  | Components/        |  |  - StatsService    |  | AI Service    | |
|  |  - dashboard/      |  |  - AwardService    |  |               | |
|  |  - record-entry/   |  |  - ClearRadarSvc   |  |               | |
|  |  - ranking/        |  |  - SessionService   |  |               | |
|  |  - hand-record/    |  |  - HandService      |  |               | |
|  |  - season/         |  |                    |  |               | |
|  |  - share/          |  |                    |  |               | |
|  |  - player/         |  |                    |  |               | |
|  |  - ai/             |  |                    |  |               | |
|  +-------------------+  +-------------------+  +--------------+ |
|                                                                 |
+================================================================+
```

### 2.3 模块职责定义

#### Presentation Layer (展示层)

| 模块 | 职责 | 对应Tab |
|------|------|---------|
| HomePage | 当前赛季概览、今日积分、清分提醒、快捷入口 | 首页 |
| RecordPage | 多人协作录入、场次汇总、战绩分享 | 记录 |
| RankingPage | 赛季/全局龙虎榜、胜率榜、清分榜、出勤榜、数据穿透 | 排行 |
| HandPage | 手牌记录列表、添加手牌、GTO分析(v2) | 手牌 |
| ProfilePage | 个人信息、赛季管理、数据备份、设置 | 我的 |

#### Application Layer (应用层)

| Store/Service | 职责 | 核心方法 |
|---------------|------|----------|
| recordStore | 比赛记录CRUD、场次管理 | addRecord, confirmSession, getRecordsBySeason |
| seasonStore | 赛季生命周期管理 | createSeason, endSeason, archiveSeason |
| settlementStore | 清分结算管理 | settlePlayer, calcBalance, getClearRadarAlerts |
| uiStore | UI状态(Tab/筛选/弹窗) | setTab, setSeasonFilter, toggleDialog |
| StatsService | 统计计算(纯函数) | computeStats, computeTrend, computeAwards |
| SessionService | 场次状态机管理 | createSession, addPlayerEntry, validateSum, confirmSession |
| ClearRadarService | 清分预警引擎 | checkThreshold, getAlerts, scheduleReminder |
| HandService | 手牌记录管理 | addHandRecord, getHandsBySession |
| ShareService | 分享图生成 | generateShareImage, saveToAlbum |

#### Infrastructure Layer (基础设施层)

| 模块 | 职责 |
|------|------|
| SQLite DB | 本地数据持久化，通过Drizzle ORM操作 |
| Tauri IPC | 桌面端原生能力调用(文件系统/通知/窗口) |
| File System | JSON导入导出、图片存储 |
| Share Engine | html2canvas截图生成 |
| Import/Export | JSON数据导入导出、腾讯文档数据解析 |
| Tencent Docs | 腾讯文档API集成 |
| AI Service | LLM分析(SSE流式) |

### 2.4 数据流设计

```
用户操作
  |
  v
UI Component (React)
  |
  | dispatch action
  v
Zustand Store
  |
  | call service
  v
Service Layer (业务逻辑)
  |
  | read/write
  v
Drizzle ORM (SQLite)
  |
  | SQL
  v
SQLite Database (本地文件)

--- 分享数据流 ---

用户点击"生成分享图"
  |
  v
ShareService.generateShareImage()
  |
  | 渲染隐藏DOM
  v
html2canvas.capture()
  |
  | Canvas -> Blob
  v
Tauri IPC / Web API
  |
  | 保存/分享
  v
相册 / 微信分享

--- 多人协作录入数据流 ---

玩家A录入 --> recordStore.addEntry(sessionId, playerA, score)
                                |
                                v
                    SessionService.validateSession(sessionId)
                                |
                    +-----------+-----------+
                    |                       |
              合计==0                   合计!=0
                    |                       |
              允许确认                显示差额，禁止提交
                    |
              recordStore.confirmSession(sessionId)
                    |
                    v
              生成分享图 / 更新排行榜
```

### 2.5 状态管理方案 (Zustand)

```typescript
// stores/record-store.ts
interface RecordStore {
  // State
  records: PokerRecord[];
  sessions: GameSession[];
  loading: boolean;

  // Actions
  loadRecords: () => Promise<void>;
  addRecord: (record: Omit<PokerRecord, 'id' | 'createdAt'>) => Promise<void>;
  createSession: (date: string, seasonId: string) => Promise<GameSession>;
  addPlayerEntry: (sessionId: string, player: string, score: number) => Promise<void>;
  confirmSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

// stores/season-store.ts
interface SeasonStore {
  seasons: Season[];
  activeSeason: Season | null;

  loadSeasons: () => Promise<void>;
  createSeason: (name: string) => Promise<void>;
  endSeason: (seasonId: string) => Promise<void>;  // 含全员清分逻辑
}

// stores/settlement-store.ts
interface SettlementStore {
  settlements: PlayerSettlement[];

  loadSettlements: () => Promise<void>;
  settlePlayer: (player: string, seasonId: string, amount: number) => Promise<void>;
  getBalance: (player: string, seasonId: string) => number;
  getClearRadarAlerts: () => ClearRadarAlert[];
}

// stores/ui-store.ts
interface UIStore {
  activeTab: TabKey;
  seasonFilter: string;
  selectedPlayer: string | null;

  setActiveTab: (tab: TabKey) => void;
  setSeasonFilter: (filter: string) => void;
  setSelectedPlayer: (player: string | null) => void;
}
```

### 2.6 数据库设计 (SQLite ER图)

```
+------------------+       +------------------+       +------------------+
|   seasons        |       |  game_sessions   |       |  poker_records   |
+------------------+       +------------------+       +------------------+
| id    TEXT PK    |<--+   | id    TEXT PK    |<--+   | id    TEXT PK    |
| name  TEXT       |   |   | date  TEXT       |   |   | session_id TEXT  |--+
| start_date TEXT  |   |   | season_id TEXT   |---+   | player TEXT      |  |
| end_date   TEXT  |   |   | status TEXT      |       | score INTEGER    |  |
| active  INTEGER  |   |   | total_records INT|       | win    INTEGER   |  |
| archived INTEGER |   |   | created_at TEXT  |       | status TEXT      |  |
| created_at TEXT  |   |   +------------------+       | created_at TEXT  |  |
+------------------+   |                                +------------------+
                       |                                          |
                       |                                          |
+------------------+   |   +------------------+       +------------------+
| player_settlement|   |   |  hand_records    |       |  clear_records   |
+------------------+   |   +------------------+       +------------------+
| id    TEXT PK    |   |   | id    TEXT PK    |       | id    TEXT PK    |
| player TEXT      |   |   | date  TEXT       |       | date  TEXT       |
| season_id TEXT   |---+   | season_id TEXT   |---+   | player TEXT      |
| settle_score INT |       | session_id TEXT  |---+   | amount INTEGER   |
| season_adjust INT|       | players TEXT     |       | season_id TEXT   |---+
| updated_at TEXT  |       | hand_type TEXT   |       | clear_type TEXT  |   |
+------------------+       | board  TEXT      |       | created_at TEXT  |   |
                           | actions TEXT     |       +------------------+   |
                           | result INTEGER   |                              |
                           | winner TEXT      |                              |
                           | notes  TEXT      |                              |
                           | tags   TEXT      |                              |
                           | photo  TEXT      |                              |
                           | gto_analysis TEXT|                              |
                           | created_at TEXT  |                              |
                           +------------------+                              |
                                                                             |
                           +------------------+                              |
                           |    ai_cache      |                              |
                           +------------------+       +------------------+  |
                           | id    TEXT PK    |       |  award_records   |  |
                           | label TEXT       |       +------------------+  |
                           | prompt TEXT      |       | id    TEXT PK    |  |
                           | result TEXT      |       | season_id TEXT   |--+
                           | time   TEXT      |       | award_key TEXT   |
                           | created_at TEXT  |       | player  TEXT     |
                           +------------------+       | value   TEXT     |
                                                      | created_at TEXT  |
                                                      +------------------+
```

**表结构详细定义**:

```sql
-- 赛季表
CREATE TABLE seasons (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  start_date  TEXT NOT NULL,           -- YYYY-MM-DD
  end_date    TEXT,                     -- NULL表示进行中
  active      INTEGER NOT NULL DEFAULT 1,
  archived    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 场次表 (新增核心实体)
CREATE TABLE game_sessions (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  date          TEXT NOT NULL,           -- YYYY-MM-DD
  season_id     TEXT NOT NULL REFERENCES seasons(id),
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending/collected/confirmed
  total_records INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_season ON game_sessions(season_id);
CREATE INDEX idx_sessions_date ON game_sessions(date);
CREATE INDEX idx_sessions_status ON game_sessions(status);

-- 比赛记录表
CREATE TABLE poker_records (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id  TEXT NOT NULL REFERENCES game_sessions(id),
  player      TEXT NOT NULL,
  score       INTEGER NOT NULL,
  win         INTEGER NOT NULL,         -- 1 or -1
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending/confirmed
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_records_session ON poker_records(session_id);
CREATE INDEX idx_records_player ON poker_records(player);

-- 玩家结算表
CREATE TABLE player_settlements (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  player        TEXT NOT NULL,
  season_id     TEXT NOT NULL REFERENCES seasons(id),
  settle_score  INTEGER NOT NULL DEFAULT 0,
  season_adjust INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player, season_id)
);

-- 清分记录表
CREATE TABLE clear_records (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  date        TEXT NOT NULL,
  player      TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  season_id   TEXT NOT NULL REFERENCES seasons(id),
  clear_type  TEXT NOT NULL,             -- 'threshold' / 'season_end'
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_clear_season ON clear_records(season_id);

-- 手牌记录表
CREATE TABLE hand_records (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  date          TEXT NOT NULL,
  season_id     TEXT NOT NULL REFERENCES seasons(id),
  session_id    TEXT REFERENCES game_sessions(id),
  players       TEXT NOT NULL,           -- 逗号分隔
  hand_type     TEXT NOT NULL,
  board         TEXT NOT NULL DEFAULT '',
  actions       TEXT NOT NULL DEFAULT '', -- JSON字符串
  result        INTEGER NOT NULL DEFAULT 0,
  winner        TEXT NOT NULL DEFAULT '',
  notes         TEXT DEFAULT '',
  tags          TEXT DEFAULT '',          -- 逗号分隔
  photo         TEXT,                     -- 本地路径
  gto_analysis  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_hand_session ON hand_records(session_id);
CREATE INDEX idx_hand_season ON hand_records(season_id);

-- 奖项记录表 (新增)
CREATE TABLE award_records (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  season_id   TEXT NOT NULL REFERENCES seasons(id),
  award_key   TEXT NOT NULL,             -- 'mvp' / 'dailyBest' / ...
  player      TEXT NOT NULL,
  value       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_award_season ON award_records(season_id);

-- AI缓存表
CREATE TABLE ai_cache (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  label       TEXT NOT NULL,
  prompt      TEXT NOT NULL,
  result      TEXT NOT NULL,
  time        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ai_cache_label ON ai_cache(label);
```

### 2.7 API/服务层设计

由于采用本地优先架构，不再需要REST API作为数据通道。服务层分为两类：

**A. Tauri IPC Commands (桌面端)**

```rust
// src-tauri/src/commands.rs
#[tauri::command]
fn get_records(season_id: Option<String>) -> Vec<PokerRecord>;

#[tauri::command]
fn create_session(date: String, season_id: String) -> GameSession;

#[tauri::command]
fn add_player_entry(session_id: String, player: String, score: i32) -> PokerRecord;

#[tauri::command]
fn confirm_session(session_id: String) -> Result<(), String>;

#[tauri::command]
fn export_json() -> String;

#[tauri::command]
fn import_json(data: String) -> Result<(), String>;

#[tauri::command]
fn save_image(data: Vec<u8>, filename: String) -> Result<String, String>;
```

**B. Next.js API Routes (Web降级模式)**

保留现有API Routes结构，但简化为SQLite操作：

```
/api/records     -> GET/POST/DELETE  操作 poker_records
/api/sessions    -> GET/POST/PUT     操作 game_sessions
/api/seasons     -> GET/POST/PUT     操作 seasons
/api/settlements -> GET/POST         操作 player_settlements
/api/hands       -> GET/POST/PUT/DEL 操作 hand_records
/api/clears      -> GET/POST         操作 clear_records
/api/awards      -> GET/POST         操作 award_records
/api/ai-analysis -> POST             SSE流式AI分析
/api/ai-cache    -> GET/POST/PUT     操作 ai_cache
/api/import-export -> POST/GET       JSON导入导出
```

### 2.8 组件架构

```
src/components/
  poker/
    home/                         # 首页模块
      season-overview.tsx         # 当前赛季概览
      today-summary.tsx           # 今日积分速览
      clear-radar-alerts.tsx      # 清分雷达预警卡片
      quick-actions.tsx           # 快捷入口

    record/                       # 记录模块
      session-list.tsx            # 场次列表
      session-card.tsx            # 场次卡片(含录入状态)
      collaborative-entry.tsx     # 多人协作录入面板
      entry-status.tsx            # 录入状态指示器(已录入/待录入)
      session-summary.tsx         # 场次汇总面板
      score-validator.tsx         # 合计校验组件

    ranking/                      # 排行模块
      dragon-tiger-board.tsx      # 龙虎榜
      win-rate-board.tsx          # 胜率榜
      clear-board.tsx             # 清分榜
      attendance-board.tsx        # 出勤榜
      season-drilldown.tsx        # 赛季穿透
      player-drilldown.tsx        # 玩家穿透

    hand/                         # 手牌模块
      hand-list.tsx               # 手牌列表
      hand-form.tsx               # 添加/编辑手牌
      hand-detail.tsx             # 手牌详情
      hand-card-svg.tsx           # 扑克牌SVG渲染

    season/                       # 赛季模块
      season-info.tsx             # 赛季信息
      season-awards.tsx           # 赛季奖项
      season-timeline.tsx         # 赛季时间线
      end-season-dialog.tsx       # 结束赛季确认

    share/                        # 分享模块
      share-card.tsx              # 分享卡片模板
      share-button.tsx            # 分享触发按钮

    player/                       # 玩家模块
      player-card.tsx             # 玩家卡片
      player-stats.tsx            # 玩家统计
      player-trend.tsx            # 玩家走势图

    ai/                           # AI模块
      ai-analysis.tsx             # AI分析面板(保留)

    common/                       # 公共组件
      score-display.tsx           # 积分显示(正绿负红)
      medal-badge.tsx             # 奖牌徽章
      date-picker.tsx             # 日期选择器
      player-select.tsx           # 玩家选择器
```

---

## 3. 开发路径规划

### 3.1 代码资产分类

| 分类 | 模块/文件 | 处理方式 |
|------|-----------|----------|
| **直接复用** | shadcn/ui组件库、utils.ts(cn函数)、globals.css(主题)、CHART_COLORS、AI分析SSE模式 | 保留不动 |
| **重构复用** | computeStats()/computeAwards()/calcBalance()、Dashboard图表、PlayerView走势图、Awards卡片布局、SeasonManager清分UI | 适配新数据模型，提取为独立Service |
| **重写** | data.ts(存储层)、page.tsx(状态管理)、record-entry.tsx(多人协作)、schema.ts(pgTable->sqliteTable)、所有API Routes(Supabase->SQLite)、CRUD层 | 从零重写 |
| **新建** | GameSession模块、Share分享模块、HandRecord手牌模块、ClearRadar清分雷达、TencentDocs集成、Zustand Stores、Tauri集成、JSON导入导出 | 全新开发 |

### 3.2 分阶段开发计划

```
Phase 0: 基础架构重构 (1周)
  |
  v
Phase 1: P0核心功能 (2周)
  |
  v
Phase 2: P1增强功能 (2周)
  |
  v
Phase 3: 跨平台与集成 (1周)
  |
  v
Phase 4: P2高级功能 (v2.0规划)
```

#### Phase 0: 基础架构重构 (1周)

**目标**: 建立新架构骨架，数据层从Supabase迁移到SQLite

| 任务 | 依赖 | 产出 |
|------|------|------|
| 0.1 安装better-sqlite3 + drizzle-orm(sqlite) | 无 | package.json更新 |
| 0.2 定义SQLite schema (sqliteTable) | 0.1 | src/storage/database/shared/schema.ts |
| 0.3 实现Drizzle CRUD层 | 0.2 | src/storage/database/crud.ts |
| 0.4 实现数据库初始化+种子数据迁移 | 0.3 | src/storage/database/seed.ts |
| 0.5 创建Zustand stores (record/season/settlement/ui) | 0.3 | src/stores/*.ts |
| 0.6 重构page.tsx，状态迁移到Zustand | 0.5 | src/app/page.tsx |
| 0.7 重写API Routes (SQLite版) | 0.3 | src/app/api/*/route.ts |
| 0.8 移除Supabase依赖 | 0.7 | 清理storage/database/supabase/ |

**关键验证点**: 所有现有功能(总览/录入/奖项/玩家/赛季/AI)在新架构下正常运行

#### Phase 1: P0核心功能 (2周)

**目标**: 实现PRD P0全部功能

| 任务 | 依赖 | 产出 |
|------|------|------|
| 1.1 GameSession场次模型+CRUD | Phase 0 | game_sessions表 + SessionService |
| 1.2 多人协作录入UI | 1.1 | collaborative-entry.tsx |
| 1.3 录入状态追踪(已录入/待录入) | 1.2 | entry-status.tsx |
| 1.4 合计校验(零和验证) | 1.2 | score-validator.tsx |
| 1.5 场次确认流程 | 1.3, 1.4 | confirmSession逻辑 |
| 1.6 分享图生成(html2canvas) | 1.5 | share-card.tsx + ShareService |
| 1.7 清分雷达预警引擎 | Phase 0 | ClearRadarService |
| 1.8 清分雷达UI(预警/触发/催办) | 1.7 | clear-radar-alerts.tsx |
| 1.9 赛季积分全清流程 | 1.7 | endSeason完整逻辑 |
| 1.10 JSON导入导出 | Phase 0 | ImportExportService |
| 1.11 首页重构(5-Tab导航) | 1.6, 1.8 | HomePage新布局 |

**关键验证点**: 完整的"创建场次 -> 多人录入 -> 校验汇总 -> 确认 -> 分享"流程可用

#### Phase 2: P1增强功能 (2周)

**目标**: 实现PRD P1全部功能

| 任务 | 依赖 | 产出 |
|------|------|------|
| 2.1 完整历史看板(龙虎/胜率/清分/出勤) | Phase 1 | ranking/模块 |
| 2.2 赛季/全局数据穿透 | 2.1 | drilldown组件 |
| 2.3 扩展奖项系统(16+奖项) | Phase 1 | AwardService扩展 + award_records表 |
| 2.4 手牌记录CRUD | Phase 1 | hand_records表 + HandService |
| 2.5 手牌记录UI(列表/表单/详情) | 2.4 | hand/模块 |
| 2.6 扑克牌SVG渲染 | 2.5 | hand-card-svg.tsx |
| 2.7 腾讯文档集成(导入) | Phase 1 | TencentDocsService |
| 2.8 腾讯文档集成(导出) | 2.7 | 导出功能 |
| 2.9 玩家详情页增强 | 2.1 | player-drilldown.tsx |

**关键验证点**: 历史数据完整可查，手牌可记录，腾讯文档可导入

#### Phase 3: 跨平台与集成 (1周)

**目标**: Tauri桌面端打包，完善体验

| 任务 | 依赖 | 产出 |
|------|------|------|
| 3.1 Tauri 2.0项目初始化 | Phase 1 | src-tauri/ |
| 3.2 Tauri IPC Commands | 3.1 | Rust后端命令 |
| 3.3 Tauri SQLite集成 | 3.2 | 原生SQLite访问 |
| 3.4 原生通知(清分提醒) | 3.2 | 系统级通知 |
| 3.5 原生文件系统(导入导出) | 3.2 | 文件对话框 |
| 3.6 桌面端构建与测试 | 3.3-3.5 | .msi / .dmg 安装包 |

**关键验证点**: 桌面端App可独立运行，离线可用，通知正常

#### Phase 4: P2高级功能 (v2.0规划)

| 任务 | 说明 |
|------|------|
| 4.1 GTO分析引擎 | 集成本地GTO库或第三方API |
| 4.2 云端同步(可选) | 用户可选开启，数据同步至云端 |
| 4.3 局域网同步 | mDNS发现 + WebSocket |
| 4.4 手牌拍照识别 | OCR识别扑克牌 |
| 4.5 React Native移动端 | iOS/Android原生App |

### 3.3 依赖关系图

```
Phase 0 (基础架构)
  |
  +-- 0.1 安装依赖
  |     +-- 0.2 SQLite Schema
  |           +-- 0.3 Drizzle CRUD
  |           |     +-- 0.4 种子数据
  |           |     +-- 0.5 Zustand Stores
  |           |     |     +-- 0.6 重构page.tsx
  |           |     +-- 0.7 重写API Routes
  |           |           +-- 0.8 移除Supabase
  |
  v
Phase 1 (P0核心)
  |
  +-- 1.1 GameSession模型
  |     +-- 1.2 多人协作录入UI
  |           +-- 1.3 录入状态追踪
  |           +-- 1.4 合计校验
  |                 +-- 1.5 场次确认
  |                       +-- 1.6 分享图生成
  |
  +-- 1.7 清分雷达引擎
  |     +-- 1.8 清分雷达UI
  |     +-- 1.9 赛季全清
  |
  +-- 1.10 JSON导入导出
  +-- 1.11 首页重构 (依赖1.6, 1.8)
  |
  v
Phase 2 (P1增强)
  |
  +-- 2.1 历史看板
  |     +-- 2.2 数据穿透
  |     +-- 2.9 玩家详情增强
  |
  +-- 2.3 扩展奖项
  +-- 2.4 手牌CRUD
  |     +-- 2.5 手牌UI
  |           +-- 2.6 扑克牌SVG
  |
  +-- 2.7 腾讯文档导入
  |     +-- 2.8 腾讯文档导出
  |
  v
Phase 3 (跨平台)
  |
  +-- 3.1 Tauri初始化
        +-- 3.2 IPC Commands
              +-- 3.3 SQLite集成
              +-- 3.4 原生通知
              +-- 3.5 原生文件系统
                    +-- 3.6 构建测试
```

---

## 4. 目标目录结构

```
poker-tracker/
  src-tauri/                          # Tauri桌面端 (Phase 3新增)
    src/
      commands.rs                     # Tauri IPC命令
      database.rs                     # Rust侧SQLite操作
    Cargo.toml
    tauri.conf.json

  src/
    app/                              # Next.js App Router
      api/                            # API Routes (Web降级模式)
        records/route.ts
        sessions/route.ts
        seasons/route.ts
        settlements/route.ts
        hands/route.ts
        clears/route.ts
        awards/route.ts
        ai-analysis/route.ts
        ai-cache/route.ts
        import-export/route.ts
      globals.css
      layout.tsx
      page.tsx                        # 精简为路由入口

    components/
      poker/                          # 业务组件 (按模块拆分)
        home/                         # 首页
        record/                       # 记录
        ranking/                      # 排行
        hand/                         # 手牌
        season/                       # 赛季
        share/                        # 分享
        player/                       # 玩家
        ai/                           # AI分析
        common/                       # 公共组件
      ui/                             # shadcn/ui (保留)

    stores/                           # Zustand状态管理 (新增)
      record-store.ts
      season-store.ts
      settlement-store.ts
      ui-store.ts

    services/                         # 业务服务层 (新增)
      stats-service.ts                # 统计计算(从stats.ts迁移)
      session-service.ts              # 场次管理
      clear-radar-service.ts          # 清分雷达
      share-service.ts                # 分享图生成
      import-export-service.ts        # 导入导出
      tencent-docs-service.ts         # 腾讯文档集成
      hand-service.ts                 # 手牌管理
      award-service.ts                # 奖项计算

    storage/
      database/
        shared/
          schema.ts                   # Drizzle SQLite Schema
          relations.ts                # 表关系定义
        crud.ts                       # Drizzle CRUD操作
        seed.ts                       # 种子数据初始化
        migration.ts                  # 数据库迁移

    lib/
      utils.ts                        # 通用工具(保留)
      constants.ts                    # 常量定义(清分阈值等)

    hooks/
      use-mobile.ts                   # 保留

  drizzle.config.ts                   # Drizzle Kit配置(SQLite)
  package.json
  tsconfig.json
```

---

## 5. 风险识别与缓解

| 风险 | 影响 | 概率 | 缓解策略 |
|------|------|------|----------|
| better-sqlite3在Tauri中的原生模块兼容问题 | 高 | 中 | 备选方案: 使用Tauri侧Rust SQLite，通过IPC通信；或使用sql.js(WASM版) |
| 多人协作录入在纯本地方案下无法实时同步 | 中 | 高 | v1.0先实现"同设备轮流录入"，v1.x引入局域网同步 |
| html2canvas在深色主题下的渲染偏差 | 低 | 中 | 提前测试，必要时使用固定样式快照而非实时DOM |
| 腾讯文档API权限和频率限制 | 中 | 中 | 优先支持CSV导出解析(无需API)，API作为增强方案 |
| Drizzle ORM SQLite支持成熟度 | 低 | 低 | Drizzle已正式支持SQLite(better-sqlite3/libsql)，社区活跃 |
| 种子数据从PostgreSQL迁移到SQLite | 低 | 低 | 数据量小(<1000条)，直接重写INSERT语句即可 |

---

## 6. 性能设计考量

| 场景 | 目标 | 方案 |
|------|------|------|
| App冷启动 | < 2秒 | SQLite同步读取 + Zustand hydration |
| 录入保存 | < 500ms | better-sqlite3同步写入，无网络延迟 |
| 汇总计算 | < 200ms | 内存中计算，SQLite索引加速查询 |
| 分享图生成 | < 1秒 | html2canvas + 预渲染模板 |
| 列表滑动 | >= 60fps | 虚拟滚动(大数据量时) + React.memo |
| 10年数据量(约5000条记录) | 全功能可用 | SQLite轻松处理百万级数据，5000条无压力 |

---

*文档结束*
