# 德扑教练功能 PRD

> **版本**: 1.0
> **日期**: 2026-06-03
> **状态**: 草案
> **负责人**: @PM

---

## 1. 产品概述

### 1.1 产品定位

德扑教练（Poker Coach）是 Poker Tracker 内置的**训练与决策辅助模块**，帮助用户在模拟场景中练习德州扑克决策，并通过 GTO（Game Theory Optimal）理论提供实时反馈和赛后复盘。

### 1.2 目标用户

- 初级玩家：想系统学习德州扑克策略，通过模拟训练提升决策水平
- 中级玩家：已有实战经验，希望对比 GTO 策略纠正偏差
- 所有 Poker Tracker 用户：在比赛记录之外，获得训练和策略指导

### 1.3 与现有功能的关系

| 现有功能 | 与本功能关系 |
|----------|-------------|
| 手牌记录（hand_records） | 教练模块可导入真实手牌进行复盘；训练模块产生的手牌可保存为手牌记录 |
| AI分析（ai-analysis） | 教练模块的 GTO 分析引擎独立于 Coze AI，但赛后复盘可调用 Coze AI 做自然语言总结 |
| 赛季/场次 | 训练模块独立于赛季系统，不产生积分影响 |

---

## 2. 功能模块

### 2.1 模块一：训练模块（Training Module）

#### 2.1.1 训练模式

支持两种模式：

| 模式 | 说明 | 筹码结构 |
|------|------|----------|
| **Cash Game（现金桌）** | 模拟标准现金桌，筹码即真钱 | 起始筹码 100BB（大盲注），可自定义 |
| **Tournament（锦标赛）** | 模拟锦标赛结构，盲注随时间上涨 | 起始筹码 10000，盲注等级可配置 |

#### 2.1.2 模拟桌面

训练桌面是核心交互界面，包含：

**牌面区域**：
- 公共牌（Board）：Flop（3张）→ Turn（1张）→ River（1张），逐步揭示
- 手牌（Hole Cards）：用户持有2张底牌，AI对手底牌隐藏
- 底池（Pot）：显示当前底池筹码量

**操作区域**：
- 用户在每个决策轮次可选择：**弃牌（Fold）** / **过牌（Check）** / **跟注（Call）** / **加注（Raise，可输入金额）** / **全下（All-in）**
- 每次操作后，AI 对手自动做出响应决策
- 显示当前底池赔率（Pot Odds）和手牌胜率（Equity）

**对手模拟**：
- 默认使用 GTO 策略作为对手（Preflop Range + Postflop Simplified Strategy）
- 可选难度级别：简单（激进/被动） / 中等 / GTO（默认）

#### 2.1.3 训练流程

```
开始训练
  ↓
选择模式（Cash / Tournament）
  ↓
设置参数（起始筹码、盲注、对手风格）
  ↓
发牌（Preflop）
  ↓
用户决策 → AI对手决策 → 下一轮（Flop/Turn/River）
  ↓
摊牌（Showdown）→ 结算底池
  ↓
记录训练结果 → 进入下一手牌 或 结束训练
```

#### 2.1.4 训练历史

- 每次训练会话保存为一条 `coach_sessions` 记录
- 每一步决策保存为 `coach_decisions` 记录
- 训练历史可在"教练中心"页面查看和筛选

### 2.2 模块二：教练模块（Coach Module）

#### 2.2.1 GTO 决策建议

在用户做出决策前/后，提供 GTO 参考建议：

| 功能 | 说明 |
|------|------|
| **Preflop Range 提示** | 根据位置（BTN/SB/BB/UTG等）和手牌，显示当前手牌在 GTO 范围表中的建议（弃牌/跟注/加注） |
| **Flop/Turn/River 建议** | 基于简化 GTO 策略（手牌强度 + 底池赔率 + 位置），给出 Fold/Check/Call/Raise 建议 |
| **胜率显示** | 实时计算当前手牌 vs 随机手牌的胜率（Equity） |
| **底池赔率** | 显示当前 Pot Odds，提示是否满足跟注条件 |
| **期望值（EV）** | 显示当前决策的预期价值（简化计算） |

#### 2.2.2 纠偏反馈

用户做出决策后，对比 GTO 推荐策略，给出偏差分析：

| 反馈类型 | 示例 |
|----------|------|
| **✅ 正确决策** | "GTO 推荐加注，你的决策正确" |
| **⚠️ 轻微偏差** | "GTO 推荐跟注（频率 65%），你选择了弃牌" |
| **❌ 严重偏差** | "GTO 推荐弃牌（-EV 决策），你跟注的预期损失为 -2.3BB" |

#### 2.2.3 赛后复盘

训练结束后，提供完整的复盘报告：

- **决策统计**：总手牌数、Fold/Check/Call/Raise 分布
- **偏差分析**：与 GTO 策略的偏差率、各轮次偏差分布
- **关键决策点**：标记 EV 损失最大的 3 个决策
- **改进建议**：基于偏差模式生成针对性建议（如"你 Flop 圈弃牌率过高"）
- **趋势对比**：与历史训练数据对比，显示进步趋势

---

## 3. 数据模型

### 3.1 新增表

#### coach_sessions（训练会话表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| mode | TEXT | "cash" \| "tournament" |
| status | TEXT | "in_progress" \| "completed" \| "abandoned" |
| starting_stack | INTEGER | 起始筹码 |
| blind_small | INTEGER | 小盲注 |
| blind_big | INTEGER | 大盲注 |
| opponent_style | TEXT | "aggressive" \| "passive" \| "gto" |
| total_hands | INTEGER | 总手牌数 |
| total_ev | REAL | 总期望值 |
| created_at | TEXT | 创建时间 |
| completed_at | TEXT | 完成时间 |

#### coach_decisions（决策记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| session_id | TEXT FK | 关联 coach_sessions |
| hand_number | INTEGER | 第几手牌 |
| street | TEXT | "preflop" \| "flop" \| "turn" \| "river" |
| hole_cards | TEXT | 用户底牌（JSON: ["Ah","Kd"]） |
| board_cards | TEXT | 公共牌（JSON: ["2s","7c","Jh",...]） |
| pot_size | INTEGER | 当前底池 |
| user_stack | INTEGER | 用户当前筹码 |
| opponent_stack | INTEGER | 对手当前筹码 |
| user_action | TEXT | "fold" \| "check" \| "call" \| "raise" \| "all_in" |
| user_bet_amount | INTEGER | 用户下注额 |
| opponent_action | TEXT | 对手决策 |
| opponent_bet_amount | INTEGER | 对手下注额 |
| gto_recommendation | TEXT | GTO 推荐动作 |
| gto_frequency | REAL | GTO 推荐频率（0~1） |
| equity | REAL | 当前手牌胜率 |
| pot_odds | REAL | 底池赔率 |
| ev | REAL | 期望值 |
| is_correct | INTEGER | 决策是否正确（boolean） |
| deviation | REAL | 偏差程度（0=无偏差，1=严重偏差） |
| result | TEXT | 手牌结果："win" \| "lose" \| "fold" |
| net_chips | INTEGER | 净筹码变化 |
| created_at | TEXT | 创建时间 |

#### coach_feedback（反馈记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| session_id | TEXT FK | 关联 coach_sessions |
| decision_id | TEXT FK | 关联 coach_decisions |
| feedback_type | TEXT | "positive" \| "minor_deviation" \| "major_deviation" |
| message | TEXT | 反馈文本 |
| suggestion | TEXT | 改进建议 |
| created_at | TEXT | 创建时间 |

### 3.2 预计算数据文件（非数据库）

| 文件 | 格式 | 说明 |
|------|------|------|
| `src/lib/coach/preflop-ranges.json` | JSON | Preflop GTO 范围表（位置×手牌→建议动作+频率） |
| `src/lib/coach/hand-rankings.json` | JSON | 手牌强度排名（用于 Postflop 简化策略） |

---

## 4. 核心引擎设计

### 4.1 赔率计算引擎

**技术选型**：`poker-odds-calculator` npm 包

**职责**：
- 计算当前手牌 vs 随机手牌的胜率（Equity）
- 支持 Preflop（2张底牌）、Flop（2+3）、Turn（2+4）、River（2+5）各阶段
- 支持多人底池胜率计算（扩展）

**接口**：
```typescript
function calculateEquity(
  holeCards: string[],      // 底牌，如 ["Ah", "Kd"]
  boardCards: string[],     // 公共牌，如 ["2s", "7c", "Jh"]
  opponentRange?: string[]  // 对手范围，可选
): { win: number; tie: number; equity: number }
```

### 4.2 GTO 范围表引擎

**技术选型**：预计算 JSON 文件 + 运行时查询

**职责**：
- 根据位置和手牌查询 Preflop GTO 建议
- 支持 6-max 和 9-max 两种桌型
- 返回建议动作（弃牌/跟注/加注）及其 GTO 频率

**数据来源**：
- 基于 `poker-odds-calculator` + `bitval` 预计算
- 参考公开 GTO 策略数据（如 GTO Wizard 公开数据、PokerSnowie 简化版）

**接口**：
```typescript
interface GTOAdvice {
  action: "fold" | "call" | "raise"
  frequency: number    // 0~1，该动作的 GTO 频率
  raiseSize?: number   // 加注大小（BB）
}

function getPreflopAdvice(
  position: string,      // "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB"
  hand: string[],        // 底牌，如 ["Ah", "Kd"]
  tableSize: 6 | 9       // 6-max 或 9-max
): GTOAdvice[]
```

### 4.3 Postflop 简化策略

**职责**：
- Flop/Turn/River 阶段提供简化 GTO 建议
- 基于手牌强度（Top Pair / Middle Pair / Draw / Bluff）和底池赔率
- 不追求 Nash Equilibrium 精确解，使用启发式规则

**策略规则**：
```
手牌强度分级：
  1. Nut（坚果） → Raise / Bet
  2. Top Pair+ → Bet / Call
  3. Middle Pair → Check / Call
  4. Draw（听牌）→ Check / Call（有合适赔率时）
  5. Weak（垃圾牌）→ Fold

决策因子：
  - 手牌强度等级
  - 底池赔率（Pot Odds）
  - 位置（In Position / Out of Position）
  - 对手动作（Bet Size）
```

---

## 5. API 设计

### 5.1 训练会话 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/coach/sessions` | 创建新训练会话 |
| GET | `/api/coach/sessions` | 获取训练历史列表（分页） |
| GET | `/api/coach/sessions/:id` | 获取训练会话详情 |
| PATCH | `/api/coach/sessions/:id` | 更新训练状态（完成/放弃） |
| DELETE | `/api/coach/sessions/:id` | 删除训练会话 |

### 5.2 决策 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/coach/sessions/:id/decisions` | 记录用户决策并返回 GTO 反馈 |
| GET | `/api/coach/sessions/:id/decisions` | 获取会话的所有决策记录 |

### 5.3 GTO 分析 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/coach/advice` | 获取 GTO 建议（不保存，用于实时提示） |
| POST | `/api/coach/equity` | 计算手牌胜率 |
| GET | `/api/coach/sessions/:id/review` | 获取赛后复盘报告 |

### 5.4 请求/响应示例

**POST /api/coach/sessions/:id/decisions**

```json
// 请求
{
  "street": "preflop",
  "holeCards": ["Ah", "Kd"],
  "boardCards": [],
  "potSize": 150,
  "userStack": 9800,
  "opponentStack": 10200,
  "userAction": "raise",
  "userBetAmount": 100
}

// 响应
{
  "success": true,
  "data": {
    "decisionId": "uuid",
    "gtoRecommendation": {
      "action": "raise",
      "frequency": 0.85,
      "raiseSize": 100
    },
    "equity": 0.652,
    "potOdds": 0.33,
    "ev": 48.5,
    "isCorrect": true,
    "feedback": {
      "type": "positive",
      "message": "AKs 在 BTN 位属于强加注范围，你的决策符合 GTO 策略",
      "suggestion": null
    },
    "opponentAction": "call",
    "opponentBetAmount": 100
  }
}
```

---

## 6. 前端页面与组件

### 6.1 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/coach` | 教练中心首页 | 训练历史、快速开始、统计概览 |
| `/coach/training` | 训练桌面 | 核心训练交互页面 |
| `/coach/review/:sessionId` | 赛后复盘 | 单次训练的复盘报告 |

### 6.2 组件树

```
components/poker/coach/
├── coach-page.tsx              # 教练中心首页（训练历史+统计+快捷入口）
├── training-table.tsx          # 训练桌面（核心交互组件）
│   ├── board-area.tsx          # 牌面区域（公共牌+底池）
│   ├── hole-cards.tsx          # 底牌显示
│   ├── action-buttons.tsx      # 操作按钮组（Fold/Check/Call/Raise/All-in）
│   ├── raise-slider.tsx        # 加注金额滑块
│   ├── pot-display.tsx         # 底池显示
│   ├── equity-display.tsx      # 胜率/赔率/EV 显示
│   ├── gto-advice-panel.tsx    # GTO 建议面板
│   ├── opponent-info.tsx       # 对手信息
│   └── hand-history.tsx        # 手牌历史侧边栏
├── review-page.tsx             # 复盘页面
│   ├── decision-stats.tsx      # 决策统计
│   ├── deviation-chart.tsx     # 偏差分布图（Recharts）
│   ├── key-decisions.tsx       # 关键决策点列表
│   └── improvement-tips.tsx    # 改进建议
├── training-settings.tsx       # 训练设置对话框
└── coach-store.ts              # Zustand Store（训练状态管理）
```

### 6.3 导航入口

- 底部导航栏新增 **"教练"** Tab，链接到 `/coach`
- TabKey 新增 `"coach"`

---

## 7. 非功能需求

### 7.1 性能

| 指标 | 目标 | 说明 |
|------|------|------|
| 赔率计算 | < 100ms | `poker-odds-calculator` 单次计算 |
| GTO 建议查询 | < 50ms | 预计算 JSON 内存查询 |
| 决策保存 | < 300ms | 单条决策记录写入 |
| 复盘报告生成 | < 500ms | 聚合计算所有决策数据 |

### 7.2 离线可用

- 训练核心功能完全离线可用（不依赖网络）
- GTO 范围表预加载到内存，无需 API 调用
- 赔率计算在浏览器端或服务端均可

### 7.3 数据存储

- 训练记录存储在本地 SQLite（与现有数据同库）
- Preflop 范围表作为静态 JSON 文件打包

---

## 8. 实施路线图

### Phase 1：MVP（核心训练 + 基础教练）

| 模块 | 内容 | 工时 |
|------|------|:----:|
| 数据库 | coach_sessions + coach_decisions 表 | 2h |
| 后端 API | 训练会话 CRUD + 决策记录 | 4h |
| 赔率引擎 | 集成 poker-odds-calculator | 3h |
| Preflop GTO | 预计算范围表 + 查询逻辑 | 4h |
| 训练桌面 UI | 牌面 + 操作按钮 + 基础交互 | 8h |
| 教练中心页面 | 训练历史列表 + 快捷开始 | 3h |
| **小计** | | **24h** |

### Phase 2：增强教练功能

| 模块 | 内容 | 工时 |
|------|------|:----:|
| GTO 纠偏反馈 | 决策对比 + 偏差分析 | 4h |
| Postflop 策略 | Flop/Turn/River 简化 GTO | 6h |
| 复盘页面 | 决策统计 + 偏差图表 + 改进建议 | 6h |
| 对手 AI 增强 | 多风格对手（激进/被动） | 4h |
| **小计** | | **20h** |

### Phase 3：进阶功能

| 模块 | 内容 | 工时 |
|------|------|:----:|
| Tournament 模式 | 盲注上涨 + 奖池结构 | 6h |
| 真实手牌复盘 | 从 hand_records 导入复盘 | 4h |
| 训练趋势 | 历史训练数据趋势图表 | 4h |
| Coze AI 总结 | 调用 AI 做自然语言复盘总结 | 3h |
| **小计** | | **17h** |

---

## 9. 约束与限制

### 9.1 技术约束

| 约束 | 说明 |
|------|------|
| 新依赖引入 | `poker-odds-calculator`（赔率计算）、`bitval`（手牌价值评估）[HUMAN-REVIEW:NEW-DEPENDENCY] |
| 数据库变更 | 新增 3 张表（coach_sessions / coach_decisions / coach_feedback） |
| 前端路由 | 新增 `/coach` 和 `/coach/review/:sessionId` 路由 |
| 导航变更 | 底部 Tab 新增 "教练" 入口 |

### 9.2 功能限制

| 限制 | 说明 |
|------|------|
| 对手 AI | Phase 1 仅支持 GTO 策略对手；多风格对手在 Phase 2 |
| Postflop GTO | Phase 1 Preflop 精确 GTO + Postflop 简化规则；Phase 2 增强 |
| Tournament 模式 | Phase 1 仅 Cash Game；Tournament 在 Phase 3 |
| 多人训练 | 仅支持 1v1（用户 vs AI），不支持多人训练桌 |

---

## 10. 验收标准

### 10.1 Phase 1 验收

- [ ] 用户可创建训练会话，选择 Cash Game 模式
- [ ] 训练桌面显示底牌、公共牌、底池
- [ ] 用户可执行 Fold/Check/Call/Raise/All-in 操作
- [ ] AI 对手自动响应决策
- [ ] 每手牌结束后正确结算底池
- [ ] 训练会话可正常完成/放弃
- [ ] 训练历史列表正确显示
- [ ] Preflop GTO 建议正确显示
- [ ] 胜率（Equity）和底池赔率实时计算
- [ ] `pnpm ts-check` 零错误
- [ ] 核心功能离线可用

### 10.2 Phase 2 验收

- [ ] 用户决策后显示 GTO 纠偏反馈
- [ ] Postflop 各阶段有 GTO 建议
- [ ] 复盘页面显示决策统计和偏差分析
- [ ] 支持多风格对手 AI

### 10.3 Phase 3 验收

- [ ] Tournament 模式正常工作
- [ ] 可从 hand_records 导入真实手牌复盘
- [ ] 训练趋势图表显示进步曲线
- [ ] Coze AI 生成自然语言复盘总结

---

## 11. 版本历史

| 版本 | 日期 | 变更内容 | 变更人 |
|:----:|:----:|----------|:------:|
| 1.0 | 2026-06-03 | 初始版本，含训练模块 + 教练模块完整 PRD | @PM |

---

*本文档由 @PM 维护*
*最后更新：2026-06-03*
