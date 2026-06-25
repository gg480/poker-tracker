# API契约文档 · Poker Tracker

**版本**: 1.0
**日期**: 2026-05-05
**状态**: 正式版
**管理者**: @Backend

---

## 概述

本文档定义了德扑积分榜（Poker Tracker）所有REST API接口的契约。所有接口遵循统一的响应格式和错误处理规范。

## 通用规范

### 响应格式

所有API接口统一使用以下响应格式：

**成功响应**：
```typescript
{
  success: true,
  data: T | null,
  error?: undefined
}
```

**错误响应**：
```typescript
{
  success: false,
  data: null,
  error: string  // 错误信息
}
```

### HTTP状态码

- `200` - 成功
- `400` - 参数错误
- `404` - 资源不存在
- `500` - 服务器错误

### 分页规范

列表类接口支持分页参数：

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| page | number | 页码（从1开始） | 1 |
| limit | number | 每页条数 | 20 |

响应格式：
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

---

## 接口列表

### 1. 赛季接口 `/api/seasons`

#### GET /api/seasons

获取所有赛季列表。

**参数**：无

**响应示例**：
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      name: "赛季1",
      startDate: "2026-01-01",
      endDate: "2026-03-31" | null,
      active: true,
      archived: false,
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/seasons

创建新赛季。

**请求体**：
```typescript
{
  name: string,        // 赛季名称（必填）
  startDate: string    // 开始日期 YYYY-MM-DD（必填）
}
```

**响应示例**：
```typescript
{
  success: true,
  data: {
    id: "uuid",
    name: "赛季3",
    startDate: "2026-04-01",
    endDate: null,
    active: true,
    archived: false,
    createdAt: "2026-04-01T00:00:00.000Z"
  }
}
```

#### PUT /api/seasons

更新赛季信息。

**请求体**：
```typescript
{
  id: string,          // 赛季ID（必填）
  name?: string,       // 赛季名称
  endDate?: string,    // 结束日期
  active?: boolean     // 是否激活
}
```

#### DELETE /api/seasons

删除赛季（仅未激活的赛季可删除）。

**请求体**：
```typescript
{
  id: string  // 赛季ID（必填）
}
```

---

### 2. 场次接口 `/api/sessions`

#### GET /api/sessions

获取场次列表。

**查询参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| season_id | string | 按赛季筛选 |

**响应示例**：
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      date: "2026-04-26",
      seasonId: "uuid",
      status: "pending" | "collected" | "confirmed",
      totalRecords: 5,
      createdAt: "2026-04-26T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/sessions

创建或查找场次。

**请求体**：
```typescript
{
  action: "find_or_create",  // 操作类型（必填）
  date: string,              // 日期 YYYY-MM-DD（必填）
  seasonId: string           // 赛季ID（必填）
}
```

#### PUT /api/sessions

更新场次状态。

**请求体**：
```typescript
{
  id: string,                          // 场次ID（必填）
  status?: "pending" | "collected" | "confirmed",
  totalRecords?: number
}
```

#### DELETE /api/sessions

删除场次。

**请求体**：
```typescript
{
  id: string  // 场次ID（必填）
}
```

---

### 3. 比赛记录接口 `/api/poker-records`

#### GET /api/poker-records

获取比赛记录列表。

**查询参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| season_id | string | 按赛季筛选 |
| session_id | string | 按场次筛选 |
| date | string | 按日期筛选（YYYY-MM-DD） |
| player | string | 按玩家筛选 |

**响应示例**：
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      date: "2026-04-26",
      seasonId: "uuid",
      sessionId: "uuid" | null,
      player: "佳",
      score: 500,
      win: 1,
      status: "pending" | "confirmed",
      createdAt: "2026-04-26T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/poker-records

批量创建比赛记录。

**请求体**：
```typescript
{
  records: Array<{
    date: string,
    seasonId: string,
    sessionId?: string,
    player: string,
    score: number,
    win: 1 | -1
  }>
}
```

#### DELETE /api/poker-records

删除比赛记录。

**请求体**：
```typescript
{
  id: string  // 记录ID（必填）
}
```

---

### 4. 结算接口 `/api/settlements`

#### GET /api/settlements

获取玩家结算列表。

**查询参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| season_id | string | 按赛季筛选 |

**响应示例**：
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      player: "佳",
      seasonId: "uuid",
      settleScore: 1000,
      seasonAdjust: 0,
      updatedAt: "2026-04-26T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/settlements

创建或更新结算记录。

**请求体**：
```typescript
{
  player: string,     // 玩家名称（必填）
  seasonId: string,   // 赛季ID（必填）
  settleScore?: number,  // 清分积分（默认0）
  seasonAdjust?: number  // 赛季调整（默认0）
}
```

---

### 5. 清分记录接口 `/api/clear-records`

#### GET /api/clear-records

获取清分记录列表。

**查询参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| season_id | string | 按赛季筛选 |

**响应示例**：
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      date: "2026-04-26",
      player: "佳",
      amount: 8000,
      seasonId: "uuid",
      clearType: "threshold" | "season_end",
      createdAt: "2026-04-26T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/clear-records

创建清分记录。

**请求体**：
```typescript
{
  date: string,         // 日期（必填）
  player: string,       // 玩家名称（必填）
  amount: number,       // 清分金额（必填）
  seasonId: string,     // 赛季ID（必填）
  clearType: "threshold" | "season_end"  // 清分类型（必填）
}
```

---

### 6. 手牌记录接口 `/api/hands`

#### GET /api/hands

获取手牌记录列表。

**查询参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| season_id | string | 按赛季筛选 |
| session_id | string | 按场次筛选 |
| is_complete | boolean | 按完成状态筛选（true/false） |

**响应示例**：
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      date: "2026-04-26",
      seasonId: "uuid",
      sessionId: "uuid" | null,
      players: "1",
      handType: "Holdem",
      board: "As Kh",
      actions: "{\"heroCards\":[\"As\",\"Kh\"],\"result\":1}",
      result: 1,
      winner: null,
      notes: "AA翻前加注",
      tags: "value",
      isComplete: false,
      quickMode: true,
      createdAt: "2026-04-26T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/hands

创建手牌记录。

**请求体**：
```typescript
{
  date: string,
  seasonId: string,
  sessionId?: string,
  players: string,
  handType?: string,
  board?: string,
  actions?: string,
  result?: number,
  winner?: string,
  notes?: string,
  tags?: string,
  isComplete?: boolean,   // 默认 false
  quickMode?: boolean     // 默认 false
}
```

#### PUT /api/hands

更新手牌记录。

**请求体**：
```typescript
{
  id: string,             // 手牌ID（必填）
  ...其他字段均可选更新
}
```

#### DELETE /api/hands

删除手牌记录。

**请求体**：
```typescript
{
  id: string  // 手牌ID（必填）
}
```

---

### 7. 奖项接口 `/api/awards`

#### GET /api/awards

获取奖项记录列表。

**查询参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| season_id | string | 按赛季筛选 |

**响应示例**：
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      seasonId: "uuid",
      player: "佳",
      awardType: "mvp",
      awardName: "MVP",
      awardIcon: "🏆",
      description: "赛季累计积分最高",
      createdAt: "2026-04-26T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/awards

创建奖项记录。

**请求体**：
```typescript
{
  seasonId: string,
  player: string,
  awardType: string,
  awardName: string,
  awardIcon: string,
  description?: string
}
```

---

### 8. AI分析接口 `/api/ai-analysis`

#### POST /api/ai-analysis

发起AI分析请求（SSE流式响应）。

**鉴权**：无需鉴权（纯前端工具，无用户系统）

**请求体**：
```typescript
{
  prompt: string,       // 分析提示词（必填）
  context?: string,     // 系统上下文（字符串，包含玩家统计数据、最近场次等）
  config?: AIConfig     // AI配置（可选，传入后覆盖默认值）
}
```

**AIConfig 定义**：
```typescript
interface AIConfig {
  apiKey?: string       // API Key，用于调用 LLM
  baseUrl?: string      // 自定义 API 地址（OpenAI 兼容格式）
  model?: string        // 模型名称，默认 "doubao-seed-2-0-lite-260215"
  temperature?: number  // 温度参数 (0~2)，默认 0.8
}
```

**配置生效规则**：
| 场景 | 行为 |
|------|------|
| 仅传入 `model` / `temperature` | 覆盖 coze SDK 的 stream() 参数 |
| 传入 `apiKey` + `baseUrl` | 降级为 fetch 直连 OpenAI 兼容 API |
| 不传 `config` | 使用 coze SDK 默认值（向后兼容） |

**响应**：Server-Sent Events（SSE）流

**事件格式**：
```
data: {"type":"content","content":"分析内容..."}

data: {"type":"done"}

data: {"type":"error","error":"错误信息"}
```

---

### 9. AI缓存接口 `/api/ai-cache`

#### GET /api/ai-cache

获取AI缓存列表。

**响应示例**：
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      label: "mvp-analysis",
      prompt: "...",
      result: "...",
      time: "3.2s",
      createdAt: "2026-04-26T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/ai-cache

创建AI缓存。

**请求体**：
```typescript
{
  label: string,
  prompt: string,
  result: string,
  time: string
}
```

#### PUT /api/ai-cache

更新AI缓存结果。

**请求体**：
```typescript
{
  id: string,
  result: string
}
```

---

### 10. 导入导出接口 `/api/import-export`

#### GET /api/import-export

导出所有数据为JSON格式。

**响应**：JSON文件下载

**响应头**：
```
Content-Type: application/json
Content-Disposition: attachment; filename="poker-tracker-backup-YYYY-MM-DD.json"
```

#### POST /api/import-export

导入JSON数据。

**请求体**：
```typescript
{
  data: ExportData,      // 导出的数据结构
  mode: "merge" | "replace"  // 合并或替换模式
}
```

---

### 11. 种子数据接口 `/api/seed`

#### POST /api/seed

初始化种子数据（仅在数据库为空时生效）。

**响应示例**：
```typescript
{
  success: true,
  data: {
    message: "种子数据初始化成功",
    counts: {
      seasons: 2,
      sessions: 10,
      records: 200,
      settlements: 5
    }
  }
}
```

---

## 数据类型定义

> **关于字段命名**：
> - 数据库列名使用蛇形命名法（snake_case），如 `start_date`、`season_id`、`created_at`
> - Drizzle ORM 在查询返回时自动将蛇形列名映射为驼峰（camelCase），如 `startDate`、`seasonId`、`createdAt`
> - 实际 API JSON 响应中的字段为 **camelCase**（与以下 TypeScript 接口保持一致）
> - 以下接口定义已与实际 API 返回字段名完全一致，前端可直接消费无需额外映射

### Season（赛季）
```typescript
interface Season {
  id: string
  name: string
  startDate: string      // YYYY-MM-DD
  endDate: string | null
  active: boolean
  archived: boolean
  createdAt: string      // ISO 8601
}
```

### GameSession（场次）
```typescript
interface GameSession {
  id: string
  date: string           // YYYY-MM-DD
  seasonId: string
  status: "pending" | "collected" | "confirmed"
  totalRecords: number
  createdAt: string
}
```

### PokerRecord（比赛记录）
```typescript
interface PokerRecord {
  id: string
  date: string
  seasonId: string
  sessionId: string | null
  player: string
  score: number
  win: 1 | -1
  status: "pending" | "confirmed"
  createdAt: string
}
```

### PlayerSettlement（玩家结算）
```typescript
interface PlayerSettlement {
  id: string
  player: string
  seasonId: string
  settleScore: number     // 请吃饭累计积分
  seasonAdjust: number    // 赛季调整
  updatedAt: string
}
```

### HandRecord（手牌记录）
```typescript
interface HandRecord {
  id: string
  date: string
  seasonId: string
  sessionId: string | null
  players: string
  handType: string | null
  board: string | null
  actions: string | null   // JSON字符串
  result: number | null
  winner: string | null
  notes: string | null
  tags: string | null
  isComplete: boolean
  quickMode: boolean
  createdAt: string
}
```

### ExportData（导出数据结构）
```typescript
interface ExportData {
  version: string
  exportedAt: string
  seasons: Season[]
  gameSessions: GameSession[]
  pokerRecords: PokerRecord[]
  playerSettlements: PlayerSettlement[]
  clearRecords: ClearRecord[]
  awardRecords: AwardRecord[]
  handRecords: HandRecord[]
}
```

### AIConfig（AI配置）
```typescript
interface AIConfig {
  apiKey?: string       // API Key，用于调用 LLM（通过 HTTPS 传输，服务端透传不落盘）
  baseUrl?: string      // 自定义 API 地址，OpenAI 兼容格式（如 https://api.openai.com/v1）
  model?: string        // 模型名称，默认 "doubao-seed-2-0-lite-260215"
  temperature?: number  // 温度参数 (0~2)，默认 0.8
}
```

---

### 11. 教练模块接口 `/api/coach`

> **说明**: 教练模块是德扑训练与决策辅助模块，所有接口路径前缀为 `/api/coach`。

#### POST /api/coach/sessions

创建新的训练会话。

**请求体**：
```typescript
{
  mode: "cash" | "tournament",     // 训练模式（必填，Phase 1 仅支持 cash）
  startingStack: number,           // 起始筹码，默认 10000（100BB）
  blindSmall: number,              // 小盲注，默认 50
  blindBig: number,                // 大盲注，默认 100
  opponentStyle: "aggressive" | "passive" | "gto"  // 对手风格，默认 "gto"
}
```

**响应示例**：
```typescript
{
  success: true,
  data: {
    id: "uuid",
    mode: "cash",
    status: "in_progress",
    startingStack: 10000,
    blindSmall: 50,
    blindBig: 100,
    opponentStyle: "gto",
    totalHands: 0,
    totalEv: 0,
    createdAt: "2026-06-03T00:00:00.000Z",
    completedAt: null
  }
}
```

---

#### GET /api/coach/sessions

获取训练会话列表（分页）。

**查询参数**：
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| page | number | 页码（从1开始） | 1 |
| limit | number | 每页条数 | 20 |
| status | string | 按状态筛选："in_progress" \| "completed" \| "abandoned" | 不筛选 |

**响应示例**：
```typescript
{
  success: true,
  data: {
    items: [
      {
        id: "uuid",
        mode: "cash",
        status: "completed",
        startingStack: 10000,
        blindSmall: 50,
        blindBig: 100,
        opponentStyle: "gto",
        totalHands: 25,
        totalEv: 48.5,
        createdAt: "2026-06-03T00:00:00.000Z",
        completedAt: "2026-06-03T01:00:00.000Z"
      }
    ],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1
  }
}
```

---

#### GET /api/coach/sessions/:id

获取训练会话详情（含决策记录）。

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 会话ID（必填） |

**响应示例**：
```typescript
{
  success: true,
  data: {
    session: {
      id: "uuid",
      mode: "cash",
      status: "in_progress",
      startingStack: 10000,
      blindSmall: 50,
      blindBig: 100,
      opponentStyle: "gto",
      totalHands: 5,
      totalEv: 12.3,
      createdAt: "2026-06-03T00:00:00.000Z",
      completedAt: null
    },
    decisions: [
      {
        id: "uuid",
        sessionId: "uuid",
        handNumber: 1,
        street: "preflop",
        holeCards: ["Ah", "Kd"],
        boardCards: [],
        potSize: 150,
        userStack: 9850,
        opponentStack: 10150,
        userAction: "raise",
        userBetAmount: 100,
        opponentAction: "call",
        opponentBetAmount: 100,
        gtoRecommendation: "raise",
        gtoFrequency: 0.85,
        equity: 0.652,
        potOdds: 0.33,
        ev: 48.5,
        isCorrect: true,
        deviation: 0,
        result: "win",
        netChips: 200,
        createdAt: "2026-06-03T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### POST /api/coach/sessions/:id/decisions

记录用户决策并返回 GTO 反馈。

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 会话ID（必填） |

**请求体**：
```typescript
{
  street: "preflop" | "flop" | "turn" | "river",  // 当前轮次（必填）
  handNumber: number,       // 第几手牌（必填）
  holeCards: string[],      // 用户底牌，如 ["Ah", "Kd"]（必填）
  boardCards: string[],     // 公共牌，如 ["2s", "7c", "Jh"]（必填，可为空数组）
  potSize: number,          // 当前底池（必填）
  userStack: number,        // 用户当前筹码（必填）
  opponentStack: number,    // 对手当前筹码（必填）
  userAction: "fold" | "check" | "call" | "raise" | "all_in",  // 用户动作（必填）
  userBetAmount: number     // 用户下注额（必填，fold/check 时为 0）
}
```

**响应示例**：
```typescript
{
  success: true,
  data: {
    decisionId: "uuid",
    gtoRecommendation: {
      action: "raise",
      frequency: 0.85,
      raiseSize: 100
    },
    equity: 0.652,
    potOdds: 0.33,
    ev: 48.5,
    isCorrect: true,
    feedback: {
      type: "positive",
      message: "AKs 在 BTN 位属于强加注范围，你的决策符合 GTO 策略",
      suggestion: null
    },
    opponentAction: "call",
    opponentBetAmount: 100,
    potSizeAfter: 350,
    userStackAfter: 9750,
    opponentStackAfter: 10250
  }
}
```

---

#### GET /api/coach/sessions/:id/advice

获取当前手牌的 GTO 建议（不保存，用于实时提示）。

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 会话ID（必填） |

**查询参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| street | string | 当前轮次（必填） |
| holeCards | string | 底牌，逗号分隔，如 "Ah,Kd"（必填） |
| boardCards | string | 公共牌，逗号分隔，如 "2s,7c,Jh"（可选） |
| potSize | number | 当前底池（可选） |
| position | string | 位置（Preflop 必填）："UTG" \| "MP" \| "CO" \| "BTN" \| "SB" \| "BB" |

**响应示例**：
```typescript
{
  success: true,
  data: {
    gtoAdvice: [
      { action: "raise", frequency: 0.85, raiseSize: 100 },
      { action: "call", frequency: 0.12 },
      { action: "fold", frequency: 0.03 }
    ],
    equity: 0.652,
    potOdds: 0.33,
    ev: 48.5,
    handStrength: "top_pair_plus",
    position: "BTN"
  }
}
```

---

#### POST /api/coach/sessions/:id/complete

完成训练会话。

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 会话ID（必填） |

**请求体**：
```typescript
{
  action: "complete" | "abandon"  // 完成或放弃（必填）
}
```

**响应示例**：
```typescript
{
  success: true,
  data: {
    id: "uuid",
    mode: "cash",
    status: "completed",
    totalHands: 25,
    totalEv: 48.5,
    completedAt: "2026-06-03T01:00:00.000Z"
  }
}
```

---

#### GET /api/coach/sessions/:id/review

获取训练复盘报告。

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 会话ID（必填） |

**响应示例**：
```typescript
{
  success: true,
  data: {
    session: {
      id: "uuid",
      mode: "cash",
      status: "completed",
      totalHands: 25,
      totalEv: 48.5,
      createdAt: "2026-06-03T00:00:00.000Z",
      completedAt: "2026-06-03T01:00:00.000Z"
    },
    stats: {
      totalHands: 25,
      actionDistribution: {
        fold: 8,
        check: 3,
        call: 6,
        raise: 7,
        allIn: 1
      },
      correctCount: 15,
      minorDeviationCount: 6,
      majorDeviationCount: 4,
      correctRate: 0.6,
      totalEv: 48.5,
      netChips: 3200,
      winRate: 0.56
    },
    deviationByStreet: {
      preflop: { correct: 8, minor: 2, major: 1 },
      flop: { correct: 4, minor: 2, major: 1 },
      turn: { correct: 2, minor: 1, major: 1 },
      river: { correct: 1, minor: 1, major: 1 }
    },
    keyDecisions: [
      {
        handNumber: 12,
        street: "river",
        userAction: "call",
        gtoRecommendation: "fold",
        ev: -12.5,
        deviation: 0.85,
        feedbackType: "major_deviation",
        message: "GTO 推荐弃牌（-EV 决策），你跟注的预期损失为 -12.5BB"
      }
    ],
    improvementTips: [
      "你的 Flop 圈弃牌率过高（40%），建议在 Flop 上多考虑 Check/Call",
      "Preflop 决策准确率较高（80%），继续保持",
      "River 圈偏差较大，建议在河牌圈更谨慎"
    ]
  }
}
```

---

#### GET /api/coach/gtoranges

获取 Preflop GTO 范围表（用于客户端缓存/展示）。

**查询参数**：
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| position | string | 位置筛选："UTG" \| "MP" \| "CO" \| "BTN" \| "SB" \| "BB" | 全部 |
| tableSize | number | 桌型：6 \| 9 | 6 |

**响应示例**：
```typescript
{
  success: true,
  data: {
    tableSize: 6,
    ranges: {
      "UTG": {
        "raise": ["AA", "KK", "QQ", "AKs", "AKo", ...],
        "call": ["TT", "JJ", "AQs", ...],
        "fold": ["72o", "83o", ...]
      },
      "BTN": {
        "raise": ["AA", "KK", "QQ", "AKs", "ATs", "KQs", ...],
        "call": ["TT", "A9s", "KTs", ...],
        "fold": ["72o", "83o", ...]
      }
    }
  }
}
```

---

#### POST /api/coach/equity

计算手牌胜率（不保存，用于实时计算）。

**请求体**：
```typescript
{
  holeCards: string[],        // 底牌，如 ["Ah", "Kd"]（必填）
  boardCards?: string[],      // 公共牌，如 ["2s", "7c", "Jh"]（可选）
  opponentRange?: string[]    // 对手范围（可选，为空时使用随机手牌）
}
```

**响应示例**：
```typescript
{
  success: true,
  data: {
    win: 0.652,
    tie: 0.015,
    equity: 0.6595,
    handName: "AKs",
    boardName: "无公共牌"
  }
}
```

---

## 教练模块数据类型定义

### CoachSession（训练会话）
```typescript
interface CoachSession {
  id: string
  mode: "cash" | "tournament"
  status: "in_progress" | "completed" | "abandoned"
  startingStack: number
  blindSmall: number
  blindBig: number
  opponentStyle: "aggressive" | "passive" | "gto"
  totalHands: number
  totalEv: number
  createdAt: string       // ISO 8601
  completedAt: string | null
}
```

### CoachDecision（决策记录）
```typescript
interface CoachDecision {
  id: string
  sessionId: string
  handNumber: number
  street: "preflop" | "flop" | "turn" | "river"
  holeCards: string[]     // JSON 数组
  boardCards: string[]    // JSON 数组
  potSize: number
  userStack: number
  opponentStack: number
  userAction: "fold" | "check" | "call" | "raise" | "all_in"
  userBetAmount: number
  opponentAction: "fold" | "check" | "call" | "raise" | "all_in" | null
  opponentBetAmount: number
  gtoRecommendation: "fold" | "check" | "call" | "raise" | null
  gtoFrequency: number | null
  equity: number | null
  potOdds: number | null
  ev: number | null
  isCorrect: boolean | null
  deviation: number | null
  result: "win" | "lose" | "fold" | null
  netChips: number | null
  createdAt: string
}
```

### CoachFeedback（反馈记录）
```typescript
interface CoachFeedback {
  id: string
  sessionId: string
  decisionId: string
  feedbackType: "positive" | "minor_deviation" | "major_deviation"
  message: string
  suggestion: string | null
  createdAt: string
}
```

### GTOAdvice（GTO 建议）
```typescript
interface GTOAdvice {
  action: "fold" | "check" | "call" | "raise"
  frequency: number       // 0~1
  raiseSize?: number      // 加注大小（BB）
}
```

### CoachReviewReport（复盘报告）
```typescript
interface CoachReviewReport {
  session: CoachSession
  stats: {
    totalHands: number
    actionDistribution: Record<"fold" | "check" | "call" | "raise" | "all_in", number>
    correctCount: number
    minorDeviationCount: number
    majorDeviationCount: number
    correctRate: number
    totalEv: number
    netChips: number
    winRate: number
  }
  deviationByStreet: Record<string, { correct: number; minor: number; major: number }>
  keyDecisions: Array<{
    handNumber: number
    street: string
    userAction: string
    gtoRecommendation: string
    ev: number
    deviation: number
    feedbackType: string
    message: string
  }>
  improvementTips: string[]
}
```

---

## 版本历史

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| 1.2 | 2026-06-03 | 新增第11节"教练模块接口"：8 个教练 API 接口定义（sessions CRUD / decisions / advice / complete / review / gtoranges / equity）+ 教练模块数据类型定义（CoachSession / CoachDecision / CoachFeedback / GTOAdvice / CoachReviewReport） | @Architect |
| 1.1 | 2026-05-05 | 第8节AI分析接口：请求体新增 config 字段（AIConfig）；数据类型新增 AIConfig 接口定义 | @Architect |
| 1.0 | 2026-05-05 | 初始版本，基于现有API Routes | @SOLO Coder |

---

*本文档由 @Backend 维护，@Architect 审批*
*最后更新：2026-06-03*
