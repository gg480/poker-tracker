# 架构文档 · Poker Tracker

**版本**: 1.6
**日期**: 2026-06-03
**状态**: 正式版
**管理者**: @Architect

---

## 1. 执行摘要

德扑积分榜（Poker Tracker）是一款面向朋友局德州扑克玩家的**多人协作式**积分追踪与分析工具。基于 Next.js 16 全栈框架构建，采用本地 SQLite 数据库存储，支持多人协作录入、实时汇总、智能清分提醒和战绩分享功能。

### 1.1 技术栈概览

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | Next.js 16 (App Router) | React 19 + TypeScript |
| UI组件 | shadcn/ui (Radix UI) | Tailwind CSS 4 |
| 状态管理 | Zustand | 轻量级、持久化支持 |
| 数据库 | SQLite | 本地文件 `data/poker-tracker.db` |
| ORM | Drizzle ORM | 类型安全、SQLite适配 |
| 图表 | Recharts | 积分走势可视化 |
| AI分析 | coze-coding-dev-sdk | SSE流式输出 |
| 包管理 | pnpm | 高性能、节省磁盘 |

### 1.2 核心价值主张

> **朋友局积分神器 — 人人可录入、局局能汇总、分享超便捷**

---

## 2. 系统架构

### 2.1 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Pages/    │  │ Components/ │  │   Hooks/    │         │
│  │  page.tsx  │  │ poker/*     │  │ use-mobile  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Stores/   │  │ Services/   │  │     API/    │         │
│  │  zustand    │  │ 业务逻辑    │  │ Route Handlers│       │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Storage/    │  │    Lib/     │  │     UI/     │         │
│  │ Database    │  │ types/utils │  │ shadcn      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块架构

| 模块 | 职责 | 技术实现 |
|------|------|----------|
| **首页（Home）** | 当前赛季概览、今日积分、清分雷达预警 | dashboard.tsx + home/*.tsx |
| **记录（Record）** | 多人协作录入、场次汇总、战绩分享 | collaborative-entry.tsx + record/*.tsx |
| **排行（Ranking）** | 龙虎榜、胜率榜、清分榜、出勤榜 | ranking-page.tsx + ranking/*.tsx |
| **手牌（Hand）** | 手牌记录、快速录入、完整向导、GTO分析 | hand-page.tsx + hand/*.tsx |
| **教练（Coach）** | 德扑训练模拟、GTO决策建议、赛后复盘 | coach-page.tsx + coach/*.tsx |
| **我的（Profile）** | 个人信息、赛季管理、数据备份 | profile-page.tsx + profile/*.tsx |
| **赛季总结（Season Report）** | 赛季数据看板、大事记、积分走势、赛季对比 | season-report/page.tsx + season-report/*.tsx |

---

## 3. 数据架构

### 3.1 数据库ER图

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   seasons    │       │  game_sessions   │       │  poker_records  │
├──────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)      │←──────│ season_id (FK)   │       │ id (PK)         │
│ name         │       │ id (PK)          │←──────│ session_id (FK) │
│ start_date   │       │ date             │       │ player          │
│ end_date     │       │ status           │       │ score           │
│ active       │       │ total_records    │       │ win             │
│ archived     │       │ created_at        │       │ status          │
│ created_at   │       └──────────────────┘       │ created_at       │
└──────────────┘              │                 └─────────────────┘
      │                       │
      │                       │
      ↓                       ↓
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│player_settle │       │   hand_records   │       │  clear_records  │
├──────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)         │
│ player       │       │ season_id (FK)    │       │ season_id (FK)  │
│ season_id(FK)│       │ session_id (FK)  │       │ player          │
│ settle_score │       │ players          │       │ amount          │
│ season_adjust│       │ hand_type        │       │ clear_type      │
│ updated_at   │       │ board            │       │ created_at      │
└──────────────┘       │ actions         │       └─────────────────┘
                        │ result          │
                        │ winner          │
                        │ is_complete     │
                        │ quick_mode      │
                        │ created_at      │
                        └─────────────────┘

┌──────────────────┐       ┌─────────────────┐       ┌──────────────────────┐
│  award_records   │       │    ai_cache     │       │   coach_sessions     │
├──────────────────┤       ├─────────────────┤       ├──────────────────────┤
│ id (PK)          │       │ id (PK)         │       │ id (PK)              │
│ season_id (FK)   │       │ label           │       │ mode                 │
│ player           │       │ prompt          │       │ status               │
│ award_type       │       │ result          │       │ starting_stack       │
│ award_name       │       │ time            │       │ blind_small          │
│ award_icon       │       │ created_at      │       │ blind_big            │
│ description      │       └─────────────────┘       │ opponent_style       │
│ created_at       │                                  │ total_hands          │
└─────────────────┘                                  │ total_ev             │
                                                      │ created_at           │
                                                      │ completed_at         │
                                                      └──────────────────────┘
                                                               │
                                                               │
                                                               ↓
                                                      ┌──────────────────────┐
                                                      │   coach_decisions    │
                                                      ├──────────────────────┤
                                                      │ id (PK)              │
                                                      │ session_id (FK)      │
                                                      │ hand_number          │
                                                      │ street               │
                                                      │ hole_cards           │
                                                      │ board_cards          │
                                                      │ pot_size             │
                                                      │ user_stack           │
                                                      │ opponent_stack       │
                                                      │ user_action          │
                                                      │ user_bet_amount      │
                                                      │ opponent_action      │
                                                      │ opponent_bet_amount  │
                                                      │ gto_recommendation   │
                                                      │ gto_frequency        │
                                                      │ equity               │
                                                      │ pot_odds             │
                                                      │ ev                   │
                                                      │ is_correct           │
                                                      │ deviation            │
                                                      │ result               │
                                                      │ net_chips            │
                                                      │ created_at           │
                                                      └──────────────────────┘
                                                               │
                                                               │
                                                               ↓
                                                      ┌──────────────────────┐
                                                      │   coach_feedback     │
                                                      ├──────────────────────┤
                                                      │ id (PK)              │
                                                      │ session_id (FK)      │
                                                      │ decision_id (FK)     │
                                                      │ feedback_type        │
                                                      │ message              │
                                                      │ suggestion           │
                                                      │ created_at           │
                                                      └──────────────────────┘
```

### 3.2 核心表结构

#### seasons（赛季表）
```sql
CREATE TABLE seasons (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  start_date  TEXT NOT NULL,
  end_date    TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  archived    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);
```

#### game_sessions（场次表）
```sql
CREATE TABLE game_sessions (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL,
  season_id     TEXT NOT NULL REFERENCES seasons(id),
  status        TEXT NOT NULL DEFAULT 'pending',
  total_records INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
```

#### poker_records（比赛记录表）
```sql
CREATE TABLE poker_records (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL,
  season_id   TEXT NOT NULL REFERENCES seasons(id),
  session_id  TEXT REFERENCES game_sessions(id),
  player      TEXT NOT NULL,
  score       INTEGER NOT NULL,
  win         INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TEXT NOT NULL
);
```

#### hand_records（手牌记录表）
```sql
CREATE TABLE hand_records (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL,
  season_id     TEXT NOT NULL REFERENCES seasons(id),
  session_id    TEXT REFERENCES game_sessions(id),
  players       TEXT NOT NULL,
  hand_type     TEXT,
  board         TEXT,
  actions       TEXT,
  result        INTEGER,
  winner        TEXT,
  notes         TEXT,
  tags          TEXT,
  is_complete   INTEGER NOT NULL DEFAULT 0,
  quick_mode    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
```

#### coach_sessions（训练会话表）
```sql
CREATE TABLE coach_sessions (
  id              TEXT PRIMARY KEY,
  mode            TEXT NOT NULL DEFAULT 'cash',        -- 'cash' | 'tournament'
  status          TEXT NOT NULL DEFAULT 'in_progress',  -- 'in_progress' | 'completed' | 'abandoned'
  starting_stack  INTEGER NOT NULL DEFAULT 10000,
  blind_small     INTEGER NOT NULL DEFAULT 50,
  blind_big       INTEGER NOT NULL DEFAULT 100,
  opponent_style  TEXT NOT NULL DEFAULT 'gto',         -- 'aggressive' | 'passive' | 'gto'
  total_hands     INTEGER NOT NULL DEFAULT 0,
  total_ev        REAL NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  completed_at    TEXT
);
CREATE INDEX coach_sessions_status_idx ON coach_sessions(status);
CREATE INDEX coach_sessions_created_idx ON coach_sessions(created_at);
```

#### coach_decisions（决策记录表）
```sql
CREATE TABLE coach_decisions (
  id                  TEXT PRIMARY KEY,
  session_id          TEXT NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
  hand_number         INTEGER NOT NULL,
  street              TEXT NOT NULL,                    -- 'preflop' | 'flop' | 'turn' | 'river'
  hole_cards          TEXT NOT NULL,                    -- JSON: ["Ah","Kd"]
  board_cards         TEXT NOT NULL DEFAULT '[]',       -- JSON: ["2s","7c","Jh"]
  pot_size            INTEGER NOT NULL,
  user_stack          INTEGER NOT NULL,
  opponent_stack      INTEGER NOT NULL,
  user_action         TEXT NOT NULL,                    -- 'fold' | 'check' | 'call' | 'raise' | 'all_in'
  user_bet_amount     INTEGER NOT NULL DEFAULT 0,
  opponent_action     TEXT,                             -- 'fold' | 'check' | 'call' | 'raise' | 'all_in'
  opponent_bet_amount INTEGER NOT NULL DEFAULT 0,
  gto_recommendation  TEXT,                             -- 'fold' | 'check' | 'call' | 'raise'
  gto_frequency       REAL,                             -- 0~1
  equity              REAL,                             -- 0~1
  pot_odds            REAL,
  ev                  REAL,
  is_correct          INTEGER,                          -- 0 | 1
  deviation           REAL,                             -- 0~1
  result              TEXT,                             -- 'win' | 'lose' | 'fold'
  net_chips           INTEGER,
  created_at          TEXT NOT NULL
);
CREATE INDEX coach_decisions_session_idx ON coach_decisions(session_id);
CREATE INDEX coach_decisions_hand_idx ON coach_decisions(session_id, hand_number);
```

#### coach_feedback（反馈记录表）
```sql
CREATE TABLE coach_feedback (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
  decision_id     TEXT NOT NULL REFERENCES coach_decisions(id) ON DELETE CASCADE,
  feedback_type   TEXT NOT NULL,                        -- 'positive' | 'minor_deviation' | 'major_deviation'
  message         TEXT NOT NULL,
  suggestion      TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX coach_feedback_session_idx ON coach_feedback(session_id);
CREATE INDEX coach_feedback_decision_idx ON coach_feedback(decision_id);
```

---

## 3.3 教练模块核心引擎

### 3.3.1 赔率计算引擎（OddsCalculator）

**文件**: `src/lib/coach/equity-engine.ts`

**职责**：计算手牌胜率（Equity）、底池赔率（Pot Odds）、期望值（EV）

**依赖**: `poker-odds-calculator` npm 包 [HUMAN-REVIEW:NEW-DEPENDENCY]

```typescript
interface EquityResult {
  win: number      // 胜率（0~1）
  tie: number      // 平局率（0~1）
  equity: number   // 综合胜率 = win + tie/2
}

interface OddsCalculator {
  /** 计算当前手牌 vs 对手范围的胜率 */
  calculateEquity(
    holeCards: string[],        // 底牌，如 ["Ah", "Kd"]
    boardCards: string[],       // 公共牌（可为空）
    opponentRange?: string[]    // 对手范围（可选，为空时使用随机手牌）
  ): EquityResult

  /** 计算底池赔率 */
  calculatePotOdds(
    potSize: number,            // 当前底池
    callAmount: number          // 需要跟注的金额
  ): number                     // 底池赔率（如 0.33 表示 33%）

  /** 计算期望值 */
  calculateEV(
    equity: number,             // 胜率
    potSize: number,            // 底池
    callAmount: number          // 跟注金额
  ): number                     // EV（正数表示+EV决策）
}
```

**支持阶段**：
- Preflop：2 张底牌
- Flop：2 底牌 + 3 公共牌
- Turn：2 底牌 + 4 公共牌
- River：2 底牌 + 5 公共牌（已知结果）

### 3.3.2 GTO 范围表引擎（GTORangeTable）

**文件**: `src/lib/coach/gto-engine.ts` + `src/lib/coach/preflop-ranges.json`

**职责**：根据位置和手牌查询 Preflop GTO 建议（6-max Cash Game）

```typescript
type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB'
type GTOAction = 'fold' | 'call' | 'raise'

interface GTOAdvice {
  action: GTOAction
  frequency: number       // 0~1，GTO 频率
  raiseSize?: number      // 加注大小（BB）
}

interface GTORangeTable {
  /** 查询 Preflop GTO 建议 */
  getPreflopAdvice(
    position: Position,
    hand: string[],        // 底牌，如 ["Ah", "Kd"]
    tableSize: 6 | 9      // 6-max 或 9-max
  ): GTOAdvice[]

  /** 获取某个位置的所有范围（用于对手模拟） */
  getRangeByPosition(
    position: Position,
    action: GTOAction
  ): string[]              // 手牌组合列表，如 ["AKs", "KK", "QQ", ...]
}
```

**数据来源**：
- `preflop-ranges.json`：预计算 JSON 文件，包含 6 个位置 × 169 种手牌的 GTO 建议
- 参考公开 GTO 策略数据（GTO Wizard / PokerSnowie 简化版）
- 使用 `bitval` npm 包辅助生成 [HUMAN-REVIEW:NEW-DEPENDENCY]

### 3.3.3 Postflop 简化策略引擎（PostflopStrategy）

**文件**: `src/lib/coach/postflop-strategy.ts` + `src/lib/coach/hand-rankings.json`

**职责**：Flop/Turn/River 阶段提供简化 GTO 建议（基于手牌强度分级的启发式规则）

```typescript
type HandStrength = 'nut' | 'top_pair_plus' | 'middle_pair' | 'draw' | 'weak'
type Street = 'preflop' | 'flop' | 'turn' | 'river'

interface PostflopAdvice {
  action: GTOAction
  frequency: number
  betSize?: number         // 下注大小（BB 或 %pot）
}

interface PostflopStrategy {
  /** 评估手牌强度 */
  evaluateHandStrength(
    holeCards: string[],
    boardCards: string[]
  ): HandStrength

  /** 获取 Postflop GTO 建议 */
  getPostflopAdvice(
    street: Street,
    handStrength: HandStrength,
    potSize: number,
    stackSize: number,
    isInPosition: boolean,
    opponentAction?: string,
    opponentBetSize?: number
  ): PostflopAdvice
}
```

**手牌强度分级规则**：
| 等级 | 条件 | 建议动作 |
|------|------|----------|
| Nut（坚果） | 当前最佳牌型（顶葫芦/同花/顺子） | Raise / Bet |
| Top Pair+ | 顶对以上（顶对+高踢脚/两对/三条） | Bet / Call |
| Middle Pair | 中对/底对 | Check / Call |
| Draw（听牌） | 同花听牌/顺子听牌 | Check / Call（有合适赔率时） |
| Weak（垃圾牌） | 无对无听牌 | Fold |

### 3.3.4 决策评估引擎（DecisionEvaluator）

**文件**: `src/lib/coach/feedback-engine.ts`

**职责**：对比用户决策 vs GTO 推荐，生成纠偏反馈

```typescript
type FeedbackType = 'positive' | 'minor_deviation' | 'major_deviation'

interface DeviationResult {
  feedbackType: FeedbackType
  message: string
  suggestion: string | null
  deviationScore: number     // 0~1
}

interface DecisionEvaluator {
  /** 评估用户决策偏差 */
  evaluateDeviation(
    userAction: GTOAction,
    gtoAdvice: GTOAdvice,
    context: {
      street: Street
      equity: number
      potOdds: number
      ev: number
      potSize: number
    }
  ): DeviationResult
}
```

**偏差判定规则**：
| 条件 | 反馈类型 |
|------|----------|
| 用户动作 == GTO 推荐动作 | positive |
| 用户动作 != GTO 推荐动作，且 GTO 频率 > 30% | minor_deviation |
| 用户动作 != GTO 推荐动作，且 GTO 频率 <= 30% | major_deviation |

### 3.3.5 AI 对手引擎（OpponentEngine）

**文件**: `src/lib/coach/opponent-engine.ts`

**职责**：模拟 AI 对手决策，基于 GTO 策略

```typescript
type OpponentStyle = 'aggressive' | 'passive' | 'gto'

interface OpponentDecision {
  action: GTOAction
  betAmount: number
}

interface OpponentEngine {
  /** 获取对手决策 */
  getOpponentDecision(
    street: Street,
    holeCards: string[],
    boardCards: string[],
    potSize: number,
    opponentStack: number,
    userAction: string,
    userBetAmount: number,
    style: OpponentStyle
  ): OpponentDecision
}
```

**决策策略**：
- **Preflop**：基于 GTO 范围表按频率随机选择动作
- **Postflop**：基于手牌强度 + 底池赔率 + 位置的简化规则
- **风格差异**：aggressive 提高加注频率，passive 降低加注频率

---

## 3.4 教练模块文件结构

```
src/lib/coach/
├── equity-engine.ts           # 赔率计算引擎（T-902）
├── gto-engine.ts              # GTO 范围表查询引擎（T-903）
├── preflop-ranges.json        # Preflop GTO 范围表数据（T-903）
├── preflop-ranges-generator.ts # 范围表生成脚本（T-903）
├── postflop-strategy.ts       # Postflop 简化策略（T-909）
├── hand-rankings.json         # 手牌强度排名数据（T-909）
├── feedback-engine.ts         # 决策评估引擎 / 纠偏反馈（T-908）
├── opponent-engine.ts         # AI 对手引擎（T-906）
└── types.ts                   # 教练模块类型定义
```

---

## 4. 应用架构

### 4.1 Zustand Stores

| Store | 职责 | 核心State | 核心Actions |
|-------|------|-----------|------------|
| uiStore | UI状态管理 | activeTab, seasonFilter | setActiveTab, setSeasonFilter |
| recordStore | 比赛记录管理 | records, sessions | loadRecords, addRecord, createSession |
| seasonStore | 赛季管理 | seasons, activeSeason | loadSeasons, createSeason, endSeason |
| settlementStore | 结算管理 | settlements | loadSettlements, settlePlayer |
| quickEntryStore | 快速录入 | step, heroCards, result, tag | setHeroCards, setResult, nextStep |
| aiConfigStore | AI配置管理 | config: { apiKey, baseUrl, model, temperature } | setConfig, resetConfig |
| coachStore | 教练训练状态 | currentSession, decisions, handNumber, street, potSize, stacks, holeCards, boardCards | createSession, recordDecision, nextHand, endSession |

### 4.2 Services

| Service | 职责 | 核心函数 |
|---------|------|----------|
| statsService | 统计计算 | computeStats, computeAwards, computeTrend |
| sessionService | 场次管理 | createSession, addPlayerEntry, confirmSession |
| awardService | 奖项计算 | computeAwards, getAwardRecords |
| clearRadarService | 清分雷达 | checkThreshold, getAlerts |
| handService | 手牌管理 | createHand, getHands, updateHand |
| shareService | 分享生成 | generateShareImage |
| importExportService | 导入导出 | exportToJSON, importFromJSON |
| tencentDocsService | 腾讯文档 | syncFromTencent, syncToTencent |
| coachService | 教练训练 | createSession, getSessions, getSession, recordDecision, getAdvice, completeSession, getReview |

---

## 5. API架构

### 5.1 API Routes结构

```
/api/
├── seasons/              # 赛季 CRUD
├── sessions/             # 场次 CRUD
├── poker-records/        # 比赛记录 CRUD
├── settlements/          # 结算 CRUD
├── clear-records/        # 清分记录 CRUD
├── hands/               # 手牌记录 CRUD
├── awards/              # 奖项记录 CRUD
├── ai-analysis/         # AI分析（SSE）
├── ai-cache/            # AI缓存
├── import-export/       # 导入导出
├── tencent-docs/        # 腾讯文档集成
│   └── callback/        # OAuth回调
├── coach/               # 教练模块（Sprint 9 新增）
│   ├── sessions/        # 训练会话 CRUD
│   │   └── [id]/
│   │       ├── decisions/  # 决策记录
│   │       ├── advice/     # GTO 建议
│   │       ├── complete/   # 完成训练
│   │       └── review/     # 复盘报告
│   ├── equity/          # 赔率计算
│   └── gtoranges/       # GTO 范围表
└── seed/                # 种子数据
```

### 5.2 响应格式规范

```typescript
// 成功
{ success: true, data: T | null }

// 错误
{ success: false, data: null, error: string }
```

### 5.3 AI分析接口配置传递

`POST /api/ai-analysis` 的请求体新增可选 `config` 字段，前端通过 `aiConfigStore` 读取用户配置，在请求时注入：

```typescript
// 请求体
{
  prompt: string,           // 分析提示词（必填）
  context?: string,         // 上下文信息
  config?: {                // AI配置（可选，传入后覆盖coze SDK默认值）
    apiKey?: string,        // API Key，为空时使用SDK默认
    baseUrl?: string,       // 自定义API地址，为空时使用SDK默认
    model?: string,         // 模型名称，默认 "doubao-seed-2-0-lite-260215"
    temperature?: number    // 温度参数(0~2)，默认 0.8
  }
}
```

**配置生效规则**：
1. `model` 和 `temperature` 始终使用传入值（即使未传 `apiKey/baseUrl`），覆盖 coze SDK 的 `client.stream()` 参数
2. 当 `apiKey` 和 `baseUrl` 同时有值时，后端降级为 **fetch 直连 OpenAI 兼容 API**，不再使用 coze SDK
3. 当 `apiKey` 和 `baseUrl` 为空时，使用 coze SDK 默认 Config（向后兼容）

**数据流**：
```
前端 aiConfigStore (localStorage)
  → POST /api/ai-analysis (携带 config)
  → 后端判断 config 有效性
    ├── 有 apiKey+baseUrl → fetch 直连 OpenAI 兼容 API
    └── 无 apiKey+baseUrl → coze SDK + 传入 model/temperature
  → SSE 流式返回
```

---



## 6. 组件架构

### 6.1 组件目录结构

```
components/poker/
├── home/                    # 首页模块
│   ├── season-overview.tsx   # 赛季概览
│   ├── today-summary.tsx    # 今日总结
│   ├── clear-radar-alerts.tsx # 清分预警
│   └── quick-actions.tsx    # 快捷入口
├── record/                   # 记录模块
│   ├── collaborative-entry.tsx # 协作录入
│   │   ├── v1.0 (初始)        # 基础录入：手动输入、一键添加玩家、零和校验（2026-04-26）
│   │   ├── v1.1 (增强)        # Phase 1：快捷玩家栏 + 积分快捷按钮 + sticky合计栏（2026-05-05）
│   │   └── v2.0 (规划)        # 待拆分：当前文件超300行后需拆为子组件
│   ├── session-list.tsx      # 场次列表
│   ├── session-card.tsx     # 场次卡片
│   ├── entry-status.tsx     # 录入状态
│   └── score-validator.tsx  # 合计校验
├── ranking/                  # 排行模块
│   ├── ranking-page.tsx     # 排行主页
│   └── awards-page.tsx      # 奖项页面
├── hand/                     # 手牌模块
│   ├── hand-page.tsx        # 手牌主页
│   ├── hand-wizard.tsx      # 完整向导
│   ├── quick-entry-wizard.tsx # 快速录入
│   ├── card-selector.tsx    # 牌面选择
│   └── poker-engine.ts      # 扑克引擎
├── season/                   # 赛季模块
│   └── end-season-dialog.tsx # 结束赛季
├── season-report/             # 赛季总结报告模块（Sprint 8 新增）
│   ├── season-report-client.tsx # 客户端组件入口，统一计算
│   ├── stats-dashboard.tsx    # 数据看板
│   ├── highlights-list.tsx    # 大事记
│   ├── trend-chart.tsx        # 积分走势图
│   ├── season-awards.tsx      # 赛季颁奖
│   └── season-comparison.tsx  # 赛季对比
├── coach/                      # 教练模块（Sprint 9 新增）
│   ├── coach-page.tsx          # 教练中心首页
│   ├── training-table.tsx      # 训练桌面（核心交互组件）
│   ├── board-area.tsx          # 牌面区域
│   ├── hole-cards.tsx          # 底牌显示
│   ├── action-buttons.tsx      # 操作按钮组
│   ├── raise-slider.tsx        # 加注金额滑块
│   ├── pot-display.tsx         # 底池显示
│   ├── equity-display.tsx      # 胜率/赔率/EV 显示
│   ├── gto-advice-panel.tsx    # GTO 建议面板
│   ├── opponent-info.tsx       # 对手信息
│   ├── hand-history.tsx        # 手牌历史侧边栏
│   ├── training-settings.tsx   # 训练设置对话框
│   ├── review-page.tsx         # 复盘页面
│   ├── decision-stats.tsx      # 决策统计
│   ├── deviation-chart.tsx     # 偏差分布图
│   ├── key-decisions.tsx       # 关键决策点列表
│   └── improvement-tips.tsx    # 改进建议
├── share/                    # 分享模块
│   ├── share-card.tsx       # 分享卡片
│   └── share-button.tsx      # 分享按钮
├── profile/                  # 个人中心
│   ├── profile-page.tsx     # 主页
│   └── tencent-docs-panel.tsx # 腾讯文档
├── common/                   # 公共组件
│   ├── score-display.tsx    # 积分显示
│   ├── medal-badge.tsx      # 奖牌徽章
│   ├── player-select.tsx    # 玩家选择
│   ├── date-picker.tsx      # 日期选择
│   └── error-boundary.tsx   # 全局错误降级UI（Sprint 6新增）
├── ui/                       # shadcn/ui + 通用UI组件
│   └── skeleton-page.tsx    # 骨架屏基座 + 页面级变体（Sprint 6新增）
│       ├── HomeSkeleton     # 首页骨架屏
│       ├── RankingSkeleton  # 排行页骨架屏
│       └── HandSkeleton     # 手牌页骨架屏
├── ranking/                  # 排行模块
│   ├── ranking-page.tsx     # 排行主页
│   ├── awards-page.tsx      # 奖项页面
│   └── rank-row.tsx         # 排行行组件（Sprint 6新增，统一前3名样式+进度条）
├── dashboard.tsx             # 总览面板
├── awards.tsx               # 奖项面板
├── player-view.tsx          # 玩家详情
├── record-entry.tsx          # 录入面板
├── season-manager.tsx       # 赛季管理
└── ai-analysis.tsx          # AI分析
```

---

## 7. 部署架构

### 7.1 开发环境

- **开发服务器**：Next.js Dev Server（端口5000）
- **数据库**：SQLite文件（`data/poker-tracker.db`）
- **包管理**：pnpm 9+

### 7.2 命令

```bash
# 开发
pnpm dev          # 启动开发服务器

# 构建
pnpm build        # 构建生产版本

# 类型检查
pnpm ts-check     # TypeScript类型检查

# 代码检查
pnpm lint         # ESLint检查

# 测试
pnpm test          # 运行单元测试
pnpm test:coverage # 运行测试并生成覆盖率报告

# 生产
pnpm start        # 启动生产服务器
```

---

## 8. 关键设计决策

### 8.1 本地优先架构

**决策**：采用本地SQLite存储，不依赖云端服务。

**理由**：
- 数据主权：用户数据完全自主，无需注册
- 离线可用：无需网络连接
- 隐私安全：数据不经过第三方服务器

### 8.2 多人协作模式

**决策**：支持多人协作录入，但使用"同设备轮流录入"模式。

**理由**：
- v1.0复杂度可控
- 数据一致性由服务端保证
- v1.x可扩展为局域网同步

### 8.3 清分雷达机制

**决策**：设置8000分清分阈值，提供80%预警和100%触发提醒。

**理由**：
- 符合朋友局德扑惯例
- 预防为主，减少清分纠纷

---

## 9. 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 冷启动时间 | < 2秒 | App首次加载 |
| 录入保存 | < 500ms | 比赛记录保存 |
| 汇总计算 | < 200ms | 零和校验 |
| 分享图生成 | < 1秒 | html2canvas截图 |
| 列表滑动 | ≥ 60fps | React虚拟化优化 |

---

## 10. 版本历史

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| 1.6 | 2026-06-03 | Sprint 9 新增德扑教练模块：数据库ER图（3.1节 coach_sessions/coach_decisions/coach_feedback）、核心引擎接口定义（3.3节 5个引擎）、教练模块文件结构（3.4节）、coachStore（4.1节）、coachService（4.2节）、API路由结构（5.1节 coach/）、组件目录结构（6.1节 coach/） | @Architect |
| 1.5 | 2026-05-10 | Sprint 8 新增赛季总结报告模块：模块架构（2.2节）、组件目录结构（6.1节 season-report/） | @Architect |
| 1.4 | 2026-05-05 | Sprint 6 整体前端重构：新增 error-boundary.tsx（全局错误兜底）、skeleton-page.tsx（骨架屏基座+页面变体）、rank-row.tsx（排行行组件）；Section 6.1 组件树更新 | @Architect |
| 1.3 | 2026-05-05 | 6.1节补充 collaborative-entry.tsx 版本变更说明（v1.0→v1.1增强） | @Architect |
| 1.2 | 2026-05-05 | 新增 aiConfigStore 到 Zustand Stores；新增 AI分析接口配置传递说明（5.3节） | @Architect |
| 1.1 | 2026-05-05 | 补充测试命令规范，完善测试相关文档 | @Architect |
| 1.0 | 2026-05-05 | 初始版本，对标PRD v3.0 | @Architect |

---

*本文档由 @Architect 维护*
*最后更新：2026-06-03（v1.6 Sprint 9 德扑教练模块）*
