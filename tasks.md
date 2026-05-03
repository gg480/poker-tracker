# 开发任务清单

**项目**: 德扑积分榜 (Poker Tracker)
**版本**: v1.0
**日期**: 2026-04-26
**基于**: PRD v3.0 + ARCHITECTURE v1.0

---

## 概述

本任务清单将项目开发路径拆解为可独立完成、可测试的原子任务，按 Phase 分组，与架构文档的开发路径对齐。每个任务可在 1-2 小时内完成。

### 任务统计

| Phase | 任务数 | 重构 | 新增 | 说明 |
|-------|--------|------|------|------|
| Phase 0: 基础架构重构 | 12 | 8 | 4 | 存储层迁移、状态管理、API重写 |
| Phase 1: P0核心功能 | 14 | 3 | 11 | 场次模型、协作录入、分享、清分雷达 |
| Phase 2: P1增强功能 | 12 | 2 | 10 | 历史看板、奖项扩展、手牌、腾讯文档 |
| Phase 3: 跨平台与集成 | 7 | 0 | 7 | Tauri集成、原生能力、构建发布 |

### 代码资产分类参考

| 分类 | 处理方式 |
|------|----------|
| 直接复用 | shadcn/ui、utils.ts、globals.css、CHART_COLORS、AI分析SSE模式 |
| 重构复用 | computeStats/computeAwards/calcBalance、Dashboard图表、PlayerView走势图、Awards卡片、SeasonManager清分UI |
| 重写 | data.ts(存储层)、page.tsx(状态管理)、record-entry.tsx(多人协作)、schema.ts(pgTable->sqliteTable)、API Routes、CRUD层 |
| 新建 | GameSession模块、Share模块、HandRecord模块、ClearRadar、TencentDocs、Zustand Stores、Tauri集成、JSON导入导出 |

---

## Phase 0: 基础架构重构

> **目标**: 建立新架构骨架，数据层从 Supabase 迁移到 SQLite，引入 Zustand 状态管理
> **关键验证点**: 所有现有功能（总览/录入/奖项/玩家/赛季/AI）在新架构下正常运行

---

### T001: 安装 SQLite 相关依赖

- **描述**: 安装 better-sqlite3、drizzle-orm (SQLite适配)、zustand 等新架构所需依赖，移除不再需要的 PostgreSQL 相关依赖
- **类型**: 重构
- **依赖**: 无
- **复杂度**: S
- **验收标准**:
  1. `pnpm add better-sqlite3 drizzle-orm zustand html2canvas` 执行成功
  2. `pnpm add -D @types/better-sqlite3` 执行成功
  3. `pnpm remove pg @types/pg @supabase/supabase-js` 执行成功（暂不删除，等T008统一清理）
  4. `package.json` 中包含 better-sqlite3、drizzle-orm、zustand、html2canvas
  5. `pnpm install` 无报错
- **产出文件**: `package.json`, `pnpm-lock.yaml`

---

### T002: 定义 SQLite Schema (Drizzle sqliteTable)

- **描述**: 将现有 `schema.ts` 中的 pgTable 定义重写为 sqliteTable，并新增架构文档中定义的所有表（game_sessions、player_settlements、hand_records、award_records、clear_records）
- **类型**: 重构
- **依赖**: T001
- **复杂度**: M
- **验收标准**:
  1. `src/storage/database/shared/schema.ts` 使用 `sqliteTable` 替代 `pgTable`
  2. 包含以下表定义：seasons、game_sessions、poker_records、player_settlements、clear_records、hand_records、award_records、ai_cache
  3. 每个表的主键使用 `text("id").primaryKey().$defaultFn(() => generateId())`
  4. 包含架构文档中定义的所有索引
  5. 外键关系正确定义（poker_records -> game_sessions -> seasons 等）
  6. TypeScript 类型可从 schema 推断（`typeof table.$inferSelect` / `$inferInsert`）
  7. 无 TypeScript 编译错误
- **技术约束**:
  - 使用 `drizzle-orm/sqlite-core` 的 `sqliteTable`、`text`、`integer`、`index`
  - ID 生成使用 `lower(hex(randomblob(16)))` 或 JS 端 UUID
  - 日期字段使用 TEXT 类型 (YYYY-MM-DD)
  - 布尔字段使用 INTEGER (0/1)
- **产出文件**: `src/storage/database/shared/schema.ts`

---

### T003: 定义表关系 (Drizzle Relations)

- **描述**: 在 relations.ts 中定义所有表之间的关系，供 Drizzle ORM 关联查询使用
- **类型**: 重构
- **依赖**: T002
- **复杂度**: S
- **验收标准**:
  1. `src/storage/database/shared/relations.ts` 定义了所有表关系
  2. seasons -> game_sessions (一对多)
  3. game_sessions -> poker_records (一对多)
  4. seasons -> player_settlements (一对多)
  5. seasons -> clear_records (一对多)
  6. seasons -> hand_records (一对多)
  7. seasons -> award_records (一对多)
  8. hand_records -> game_sessions (多对一，可选)
  9. 无 TypeScript 编译错误
- **产出文件**: `src/storage/database/shared/relations.ts`

---

### T004: 实现 Drizzle 数据库连接与初始化

- **描述**: 创建 SQLite 数据库连接实例，实现数据库初始化逻辑（建表、索引创建）
- **类型**: 新增
- **依赖**: T002
- **复杂度**: M
- **验收标准**:
  1. `src/storage/database/drizzle.ts` 创建 better-sqlite3 数据库实例
  2. 使用 `drizzle(betterSqlite3(db))` 初始化 Drizzle ORM
  3. 数据库文件路径为 `./data/poker-tracker.db`（可通过环境变量配置）
  4. 启用 WAL 模式以提升并发性能
  5. 启用外键约束 `PRAGMA foreign_keys = ON`
  6. 导出 `db` 实例供 CRUD 层使用
  7. `drizzle.config.ts` 更新为 SQLite 配置
- **产出文件**: `src/storage/database/drizzle.ts`, `drizzle.config.ts`

---

### T005: 实现 Drizzle CRUD 层

- **描述**: 重写 CRUD 层，使用 Drizzle ORM 操作 SQLite 数据库，替代 Supabase 客户端调用
- **类型**: 重构
- **依赖**: T004, T003
- **复杂度**: L
- **验收标准**:
  1. `src/storage/database/crud.ts` 实现所有 CRUD 操作
  2. seasons CRUD: getAllSeasons, getActiveSeasons, getSeasonById, insertSeason, updateSeason, endSeasonById
  3. poker_records CRUD: getAllRecords, getRecordsByDateRange, getRecordsBySession, insertRecord, insertRecords, deleteRecordsByDate
  4. player_settlements CRUD: getAllSettlements, getSettlementsBySeason, getSettlementByPlayer, upsertSettlement
  5. clear_records CRUD: getAllClears, getClearsBySeason, insertClearRecord
  6. ai_cache CRUD: getAllAICache, insertAICache, updateAICache, findAICacheByLabel, trimAICache
  7. 所有函数使用 Drizzle 的 query builder API（`db.select()`、`db.insert()` 等）
  8. 无 Supabase 依赖
  9. 导出类型定义供 API Routes 和 Stores 使用
- **产出文件**: `src/storage/database/crud.ts`

---

### T006: 实现种子数据迁移

- **描述**: 将 data.ts 中硬编码的种子数据（SEED_RECORDS、SEED_SEASONS、SEED_SETTLEMENTS）迁移到数据库初始化脚本，首次启动时自动写入 SQLite
- **类型**: 重构
- **依赖**: T005
- **复杂度**: M
- **验收标准**:
  1. `src/storage/database/seed.ts` 包含种子数据初始化逻辑
  2. 首次启动（数据库为空时）自动插入种子数据
  3. 种子数据包含现有 SEED_SEASONS（赛季1、赛季2）
  4. 种子数据包含现有 SEED_RECORDS（约 200+ 条历史记录）
  5. 种子数据包含现有 SEED_SETTLEMENTS（赛季1的清分记录）
  6. 种子数据为现有记录自动创建 game_sessions（按日期分组）
  7. 重复执行种子脚本不会产生重复数据（幂等性）
  8. `src/lib/data.ts` 中的 SEED_* 常量保留但标记为 `@deprecated`
- **产出文件**: `src/storage/database/seed.ts`

---

### T007: 创建 UI Store (Zustand)

- **描述**: 创建 uiStore 管理 UI 状态（Tab 切换、赛季筛选、选中玩家、弹窗状态），从 page.tsx 中提取
- **类型**: 新增
- **依赖**: T001
- **复杂度**: S
- **验收标准**:
  1. `src/stores/ui-store.ts` 创建 Zustand store
  2. 状态包含: activeTab、seasonFilter、selectedPlayer、dialogStates
  3. Actions 包含: setActiveTab、setSeasonFilter、setSelectedPlayer、toggleDialog
  4. Tab 类型定义与 PRD 一致：home、record、ranking、hand、profile
  5. 支持 `persist` 中间件（可选，localStorage 缓存用户偏好）
  6. 导出 `useUIStore` hook
- **产出文件**: `src/stores/ui-store.ts`

---

### T008: 创建 Record Store (Zustand)

- **描述**: 创建 recordStore 管理比赛记录和场次数据，替代 page.tsx 中的 records state 和相关处理函数
- **类型**: 新增
- **依赖**: T005
- **复杂度**: M
- **验收标准**:
  1. `src/stores/record-store.ts` 创建 Zustand store
  2. 状态包含: records、sessions、loading
  3. Actions 包含: loadRecords、addRecord、createSession、addPlayerEntry、confirmSession、deleteSession
  4. loadRecords 从 SQLite 加载数据（通过 API Routes）
  5. addRecord 保存到 SQLite 并更新本地状态
  6. 暂不实现多人协作逻辑（Phase 1 实现），先保持现有单点录入功能
  7. 与现有 page.tsx 中的 records 逻辑功能等价
- **产出文件**: `src/stores/record-store.ts`

---

### T009: 创建 Season Store 和 Settlement Store (Zustand)

- **描述**: 创建 seasonStore 和 settlementStore，管理赛季生命周期和清分结算数据
- **类型**: 新增
- **依赖**: T005
- **复杂度**: M
- **验收标准**:
  1. `src/stores/season-store.ts` 创建赛季 store
     - 状态: seasons、activeSeason
     - Actions: loadSeasons、createSeason、endSeason（含全员清分逻辑）
  2. `src/stores/settlement-store.ts` 创建结算 store
     - 状态: settlements
     - Actions: loadSettlements、settlePlayer、getBalance、getClearRadarAlerts（暂为空实现）
  3. endSeason 逻辑从 page.tsx 的 handleEndSeason 迁移
  4. settlePlayer 逻辑从 page.tsx 的 handleSettlePlayer 迁移
  5. calcBalance 等计算函数从 data.ts 引用
  6. 与现有功能等价
- **产出文件**: `src/stores/season-store.ts`, `src/stores/settlement-store.ts`

---

### T010: 重写 API Routes (SQLite 版)

- **描述**: 将所有 API Routes 从 Supabase 客户端调用改为使用新的 Drizzle CRUD 层
- **类型**: 重构
- **依赖**: T005
- **复杂度**: M
- **验收标准**:
  1. `src/app/api/poker-records/route.ts` 使用 crud.ts 中的函数
  2. `src/app/api/seasons/route.ts` 使用 crud.ts 中的函数
  3. `src/app/api/settlements/route.ts` 使用 crud.ts 中的函数
  4. `src/app/api/clear-records/route.ts` 使用 crud.ts 中的函数
  5. `src/app/api/ai-cache/route.ts` 使用 crud.ts 中的函数
  6. `src/app/api/ai-analysis/route.ts` 保持不变（SSE 模式，不涉及数据库变更）
  7. 新增 `src/app/api/sessions/route.ts`（GameSession CRUD，暂为空壳）
  8. 所有 API 的请求/响应格式保持向后兼容
  9. 无 Supabase 导入
- **产出文件**: `src/app/api/*/route.ts`

---

### T011: 重构 page.tsx，状态迁移到 Zustand

- **描述**: 将 page.tsx 中的所有状态管理逻辑迁移到 Zustand stores，page.tsx 精简为路由入口和布局组件
- **类型**: 重构
- **依赖**: T007, T008, T009, T010
- **复杂度**: L
- **验收标准**:
  1. page.tsx 不再使用 useState 管理 records/seasons/settlements/tab/seasonFilter/selectedPlayer
  2. 所有状态从 Zustand stores 获取（useUIStore、useRecordStore、useSeasonStore、useSettlementStore）
  3. 数据加载逻辑从 useEffect 迁移到 stores 的 load* 方法
  4. 现有 6 个 Tab（总览/录入/奖项/玩家/赛季/AI）功能正常
  5. 赛季筛选功能正常
  6. 清分结算功能正常
  7. 页面加载、数据保存无报错
  8. page.tsx 行数 < 100 行
- **产出文件**: `src/app/page.tsx`

---

### T012: 移除 Supabase 依赖，清理旧代码

- **描述**: 删除所有 Supabase 相关文件和依赖，清理 data.ts 中的 API 调用和 localStorage 降级逻辑
- **类型**: 重构
- **依赖**: T010, T011
- **复杂度**: M
- **验收标准**:
  1. 删除 `src/storage/database/supabase/` 目录
  2. 删除 `src/storage/database/supabase-client.ts`
  3. 删除 `src/storage/database/crud-server.ts`
  4. `package.json` 中移除 `@supabase/supabase-js`、`pg`、`@types/pg`
  5. `src/lib/data.ts` 清理：移除 apiGet/apiPost/apiPut/apiDelete 函数，移除 localStorage 降级逻辑，移除 SEED_* 常量（已迁移到 seed.ts）
  6. data.ts 仅保留纯计算函数（calcBalance、getSettlementForPlayer 等）和类型定义
  7. `pnpm install` 无报错
  8. `pnpm dev` 启动正常，所有功能可用
- **产出文件**: 删除多个文件，修改 `src/lib/data.ts`、`package.json`

---

## Phase 1: P0 核心功能

> **目标**: 实现 PRD P0 全部功能
> **关键验证点**: 完整的"创建场次 -> 多人录入 -> 校验汇总 -> 确认 -> 分享"流程可用

---

### T013: GameSession 场次模型与 CRUD

- **描述**: 实现 GameSession 实体的完整 CRUD 操作，包括场次创建、状态流转（pending -> collected -> confirmed）
- **类型**: 新增
- **依赖**: T005
- **复杂度**: M
- **验收标准**:
  1. `src/services/session-service.ts` 实现 SessionService
  2. createSession(date, seasonId): 创建新场次，状态为 pending
  3. addPlayerEntry(sessionId, player, score): 添加玩家录入，更新 totalRecords
  4. validateSession(sessionId): 校验场次所有记录合计是否为零
  5. confirmSession(sessionId): 确认场次，状态变为 confirmed
  6. deleteSession(sessionId): 删除场次及其所有记录
  7. getSessionsBySeason(seasonId): 获取赛季下所有场次
  8. 场次状态机: pending -> collected(所有人已录入) -> confirmed(确认)
  9. API Route `src/app/api/sessions/route.ts` 实现完整 CRUD
  10. recordStore 中集成 session 相关 actions
- **产出文件**: `src/services/session-service.ts`, `src/app/api/sessions/route.ts`

---

### T014: 多人协作录入 UI

- **描述**: 重构 record-entry.tsx 为多人协作录入模式，支持选择场次、各玩家独立录入积分
- **类型**: 重构
- **依赖**: T013
- **复杂度**: L
- **验收标准**:
  1. `src/components/poker/record/collaborative-entry.tsx` 新建协作录入面板
  2. 支持创建新场次（选择日期、选择参与玩家）
  3. 每个玩家一行：玩家名 + 积分输入框
  4. 实时显示所有玩家的录入状态（已录入/待录入）
  5. 实时显示合计值，合计不为零时显示差额警告
  6. 合计为零时显示"确认保存"按钮
  7. 保留现有 record-entry.tsx 的数据管理功能（重置等）
  8. 适配移动端布局
- **产出文件**: `src/components/poker/record/collaborative-entry.tsx`

---

### T015: 场次列表与场次卡片组件

- **描述**: 创建场次列表和场次卡片组件，展示历史场次及录入状态
- **类型**: 新增
- **依赖**: T013
- **复杂度**: M
- **验收标准**:
  1. `src/components/poker/record/session-list.tsx` 场次列表组件
  2. `src/components/poker/record/session-card.tsx` 场次卡片组件
  3. 场次卡片显示：日期、录入状态（X/Y人已录入）、合计值、状态标签
  4. 点击场次卡片展开查看详情（各玩家积分）
  5. pending 状态的场次可继续录入
  6. confirmed 状态的场次只读
  7. 按日期倒序排列
- **产出文件**: `src/components/poker/record/session-list.tsx`, `src/components/poker/record/session-card.tsx`

---

### T016: 录入状态指示与合计校验组件

- **描述**: 创建录入状态指示器和合计校验组件，从协作录入面板中提取为独立组件
- **类型**: 新增
- **依赖**: T014
- **复杂度**: S
- **验收标准**:
  1. `src/components/poker/record/entry-status.tsx` 录入状态指示器
     - 显示每个玩家的录入状态（已录入/待录入）
     - 已录入显示积分值，待录入显示"待录入"
     - 支持点击待录入玩家快速录入
  2. `src/components/poker/record/score-validator.tsx` 合计校验组件
     - 实时计算并显示合计值
     - 合计为零显示绿色对勾
     - 合计不为零显示红色差额
     - 有人未录入显示等待状态
  3. 组件可独立使用，不依赖外部状态
- **产出文件**: `src/components/poker/record/entry-status.tsx`, `src/components/poker/record/score-validator.tsx`

---

### T017: 场次确认流程

- **描述**: 实现场次确认的完整流程：所有玩家录入完毕 -> 校验合计为零 -> 确认保存 -> 更新排行榜
- **类型**: 新增
- **依赖**: T015, T016
- **复杂度**: M
- **验收标准**:
  1. 所有玩家录入后，系统自动校验合计
  2. 合计为零：显示"确认保存"按钮
  3. 合计不为零：显示差额，禁止确认
  4. 确认后场次状态变为 confirmed
  5. 确认后自动更新排行榜数据
  6. 确认后显示"生成分享图"和"查看战绩"按钮
  7. 确认操作不可撤销（需二次确认弹窗）
- **产出文件**: 修改 `src/components/poker/record/collaborative-entry.tsx`, `src/services/session-service.ts`

---

### T018: 分享图生成 (html2canvas)

- **描述**: 实现分享卡片模板和截图生成功能，一键生成当局战绩分享图片
- **类型**: 新增
- **依赖**: T017
- **复杂度**: M
- **验收标准**:
  1. `src/services/share-service.ts` 实现 ShareService
  2. `src/components/poker/share/share-card.tsx` 分享卡片模板
     - 显示赛季名称、场次编号、日期
     - 按积分排序显示所有玩家
     - 前三名显示奖牌
     - 显示本场 MVP 和积分王
     - 底部显示 App 标识
  3. `src/components/poker/share/share-button.tsx` 分享触发按钮
  4. 使用 html2canvas 将分享卡片渲染为图片
  5. 支持保存到本地（下载）
  6. 图片生成时间 < 1 秒
  7. 分享卡片样式美观，适配深色主题
- **产出文件**: `src/services/share-service.ts`, `src/components/poker/share/share-card.tsx`, `src/components/poker/share/share-button.tsx`

---

### T019: 清分雷达预警引擎

- **描述**: 实现清分雷达服务，自动检测玩家余额是否达到预警/触发阈值，生成提醒
- **类型**: 新增
- **依赖**: T009
- **复杂度**: M
- **验收标准**:
  1. `src/services/clear-radar-service.ts` 实现 ClearRadarService
  2. checkThreshold(player, balance): 检查玩家余额阈值
     - 余额 >= 6400 (80%): 返回预警级别 alert
     - 余额 >= 8000 (100%): 返回触发级别 trigger
  3. getAlerts(seasonId): 获取当前赛季所有预警信息
  4. scheduleReminder(player): 记录催办时间，48小时未清分返回催办提醒
  5. 余额计算公式: balance = total_score - settle_score + season_adjust
  6. 预警数据从 settlementStore 和 recordStore 获取
  7. 纯函数实现，便于测试
- **产出文件**: `src/services/clear-radar-service.ts`

---

### T020: 清分雷达 UI (预警/触发/催办)

- **描述**: 在首页和赛季管理页面展示清分雷达预警卡片，显示预警、触发、催办三种状态
- **类型**: 新增
- **依赖**: T019
- **复杂度**: M
- **验收标准**:
  1. `src/components/poker/home/clear-radar-alerts.tsx` 清分雷达预警卡片
  2. 预警状态（80%）：黄色警告样式，显示"距离清分还差 X 分"
  3. 触发状态（100%）：红色警告样式，显示"请尽快清分！"
  4. 催办状态（48h未清分）：橙色提醒样式，显示"记得请吃饭哦~"
  5. 每个预警卡片可直接操作清分（跳转到赛季管理）
  6. 无预警时显示"暂无清分提醒"
  7. 集成到首页 Dashboard 区域
- **产出文件**: `src/components/poker/home/clear-radar-alerts.tsx`

---

### T021: 赛季积分全清流程完善

- **描述**: 完善赛季结束的全清流程：自动结算 -> 积分封存 -> 提示备份 -> 新赛季开启
- **类型**: 重构
- **依赖**: T019
- **复杂度**: M
- **验收标准**:
  1. 结束赛季时自动执行全员清分（season_adjust += -balance）
  2. 赛季状态变为 archived，设置 endDate
  3. 结束赛季后弹出确认对话框，显示清分结果摘要
  4. 提示用户备份数据（JSON 导出）
  5. 新赛季创建时：所有玩家积分重置为 0，清分记录延续
  6. 已封存赛季的数据只读，不可修改
  7. `src/components/poker/season/end-season-dialog.tsx` 结束赛季确认弹窗
- **产出文件**: `src/stores/season-store.ts`（修改）, `src/components/poker/season/end-season-dialog.tsx`

---

### T022: JSON 导入导出服务

- **描述**: 实现 JSON 格式的数据导入导出功能，支持全量数据备份和恢复
- **类型**: 新增
- **依赖**: T005
- **复杂度**: M
- **验收标准**:
  1. `src/services/import-export-service.ts` 实现 ImportExportService
  2. exportToJSON(): 导出全量数据为 JSON 字符串
     - 包含 seasons、game_sessions、poker_records、player_settlements、clear_records
     - 包含导出时间戳和版本号
  3. importFromJSON(jsonString): 从 JSON 导入数据
     - 校验 JSON 格式和版本兼容性
     - 支持覆盖导入和合并导入
     - 导入前自动备份当前数据
  4. API Route `src/app/api/import-export/route.ts` 实现 GET(导出)/POST(导入)
  5. 导出文件名格式: `poker-tracker-backup-YYYY-MM-DD.json`
  6. 导入时校验合计为零（对每场记录）
- **产出文件**: `src/services/import-export-service.ts`, `src/app/api/import-export/route.ts`

---

### T023: 首页重构 - 5 Tab 导航

- **描述**: 将现有 6 Tab 导航重构为 PRD 定义的 5 Tab 导航（首页/记录/排行/手牌/我的），重新组织各 Tab 内容
- **类型**: 重构
- **依赖**: T018, T020
- **复杂度**: L
- **验收标准**:
  1. Tab 导航更新为: 首页、记录、排行、手牌、我的
  2. **首页**: 当前赛季概览 + 今日积分速览 + 清分雷达预警 + 快捷入口
     - `src/components/poker/home/season-overview.tsx`
     - `src/components/poker/home/today-summary.tsx`
     - `src/components/poker/home/quick-actions.tsx`
  3. **记录**: 多人协作录入 + 场次列表 + 战绩分享
  4. **排行**: 龙虎榜 + 胜率榜 + 清分榜 + 出勤榜（复用 Dashboard 组件）
  5. **手牌**: 手牌记录列表（Phase 2 完善内容，Phase 1 显示占位）
  6. **我的**: 个人信息 + 赛季管理 + 数据备份 + 设置
  7. 赛季筛选器保留在顶部
  8. 移动端底部 Tab 导航
- **产出文件**: `src/app/page.tsx`（修改）, `src/components/poker/home/*.tsx`

---

### T024: 常量与类型定义整理

- **描述**: 创建统一的常量定义文件和类型导出，清理分散在各处的硬编码值
- **类型**: 重构
- **依赖**: T011
- **复杂度**: S
- **验收标准**:
  1. `src/lib/constants.ts` 集中定义常量
     - CLEAR_THRESHOLD = 8000
     - CLEAR_WARNING_RATIO = 0.8
     - REMINDER_INTERVAL_HOURS = 48
     - MIN_GAMES_FOR_AWARD = 5
  2. `src/lib/types.ts` 集中导出类型定义
     - 从 data.ts 迁移 PokerRecord、Season、PlayerSettlement 等
     - 新增 GameSession、HandRecord、AwardRecord 等类型
     - 新增 ClearRadarAlert 类型
  3. 各文件统一从 constants.ts 和 types.ts 导入
  4. 无硬编码的魔法数字
- **产出文件**: `src/lib/constants.ts`, `src/lib/types.ts`

---

### T025: 公共组件提取

- **描述**: 提取多个模块共用的公共组件，减少代码重复
- **类型**: 重构
- **依赖**: T023
- **复杂度**: S
- **验收标准**:
  1. `src/components/poker/common/score-display.tsx` 积分显示组件（正绿负红）
  2. `src/components/poker/common/medal-badge.tsx` 奖牌徽章组件
  3. `src/components/poker/common/player-select.tsx` 玩家选择器组件
  4. `src/components/poker/common/date-picker.tsx` 日期选择器组件
  5. Dashboard 和 SeasonManager 中的重复代码提取到公共组件
  6. 现有组件改用公共组件，无功能回归
- **产出文件**: `src/components/poker/common/*.tsx`

---

### T026: Phase 0+1 集成测试与回归验证

- **描述**: 对 Phase 0 和 Phase 1 的所有功能进行集成测试，确保端到端流程可用
- **类型**: 新增
- **依赖**: T023, T024, T025
- **复杂度**: M
- **验收标准**:
  1. 完整流程测试: 创建赛季 -> 创建场次 -> 多人录入 -> 校验汇总 -> 确认 -> 分享
  2. 清分雷达测试: 余额达到阈值 -> 预警显示 -> 清分操作 -> 余额更新
  3. 赛季结束测试: 结束赛季 -> 全员清分 -> 新赛季创建
  4. JSON 导入导出测试: 导出 -> 修改 -> 导入 -> 数据一致
  5. 5 Tab 导航切换正常
  6. 赛季筛选功能正常
  7. AI 分析功能正常
  8. 无控制台报错
  9. 移动端布局正常
- **产出文件**: 测试记录（无需产出代码文件）

---

## Phase 2: P1 增强功能

> **目标**: 实现 PRD P1 全部功能
> **关键验证点**: 历史数据完整可查，手牌可记录，腾讯文档可导入，奖项丰富

---

### T027: 统计计算服务提取

- **描述**: 将 stats.ts 中的 computeStats 和 computeAwards 提取为独立的 Service 层，适配新的数据模型（GameSession）
- **类型**: 重构
- **依赖**: T013
- **复杂度**: M
- **验收标准**:
  1. `src/services/stats-service.ts` 实现 StatsService
  2. computeStats 从 stats.ts 迁移，适配 GameSession 模型
  3. computeTrend 保留现有趋势计算逻辑
  4. computeAwards 迁移，返回 Award 接口
  5. 新增 computePlayerStats(playerName): 单玩家详细统计
  6. 新增 computeSeasonComparison(seasonId1, seasonId2): 赛季对比
  7. 纯函数实现，无副作用
  8. 现有 Dashboard、PlayerView 等组件改用 StatsService
- **产出文件**: `src/services/stats-service.ts`

---

### T028: 历史看板 - 龙虎榜与胜率榜

- **描述**: 实现龙虎榜和胜率榜组件，支持赛季/全局切换
- **类型**: 重构
- **依赖**: T027
- **复杂度**: M
- **验收标准**:
  1. `src/components/poker/ranking/dragon-tiger-board.tsx` 龙虎榜组件
     - 全时期累计积分排行
     - 赛季筛选切换
     - 前三名奖牌高亮
  2. `src/components/poker/ranking/win-rate-board.tsx` 胜率榜组件
     - 全时期胜率排行（>=5场）
     - 赛季筛选切换
     - 胜率进度条可视化
  3. 从 Dashboard 中提取相关逻辑
  4. 支持点击玩家跳转到玩家详情
- **产出文件**: `src/components/poker/ranking/dragon-tiger-board.tsx`, `src/components/poker/ranking/win-rate-board.tsx`

---

### T029: 历史看板 - 清分榜与出勤榜

- **描述**: 实现清分榜和出勤榜组件
- **类型**: 新增
- **依赖**: T027
- **复杂度**: S
- **验收标准**:
  1. `src/components/poker/ranking/clear-board.tsx` 清分榜组件
     - 全时期请吃饭累计排行
     - 显示每个玩家的清分次数和总金额
  2. `src/components/poker/ranking/attendance-board.tsx` 出勤榜组件
     - 全时期参与场次排行
     - 显示每个玩家的参与场次和出勤率
  3. 赛季筛选切换
  4. 支持点击玩家跳转
- **产出文件**: `src/components/poker/ranking/clear-board.tsx`, `src/components/poker/ranking/attendance-board.tsx`

---

### T030: 赛季/全局数据穿透

- **描述**: 实现从全局看板穿透到赛季详情、玩家详情、场次详情的导航
- **类型**: 新增
- **依赖**: T028, T029
- **复杂度**: M
- **验收标准**:
  1. `src/components/poker/ranking/season-drilldown.tsx` 赛季穿透组件
     - 点击赛季 -> 显示赛季详情（玩家列表、龙虎榜、奖项、场次时间线）
  2. `src/components/poker/ranking/player-drilldown.tsx` 玩家穿透组件
     - 点击玩家 -> 显示玩家详情（统计、走势、单场记录）
  3. 穿透路径: 全局看板 -> 赛季选择 -> 赛季详情 -> 场次选择 -> 场次详情
  4. 面包屑导航，支持返回
  5. 复用现有 PlayerView 和 Dashboard 组件
- **产出文件**: `src/components/poker/ranking/season-drilldown.tsx`, `src/components/poker/ranking/player-drilldown.tsx`

---

### T031: 扩展奖项系统 (16+ 奖项)

- **描述**: 将现有 8 个奖项扩展为 PRD 定义的 16+ 奖项，包括赢家奖项、输家鼓励奖项、特别奖项
- **类型**: 重构
- **依赖**: T027
- **复杂度**: L
- **验收标准**:
  1. `src/services/award-service.ts` 实现 AwardService
  2. 赢家奖项 (6个): 赛季冠军、财富之星、进步最快、胜率之王、最长连胜、场均王者
  3. 输家鼓励奖项 (6个): 凤凰涅槃、永不言弃、追赶之星、好搭档、全勤奖、运气欠佳
  4. 特别奖项 (3个): 风度奖、记录之星、气氛组
  5. 每个奖项有明确的评判规则和计算逻辑
  6. 奖项结果持久化到 award_records 表
  7. 赛季结束时自动计算并保存奖项
  8. `src/components/poker/season/season-awards.tsx` 奖项展示组件
  9. 奖项支持生成分享图片
- **产出文件**: `src/services/award-service.ts`, `src/components/poker/season/season-awards.tsx`

---

### T032: 手牌记录 CRUD

- **描述**: 实现手牌记录的数据模型和 CRUD 操作
- **类型**: 新增
- **依赖**: T005
- **复杂度**: M
- **验收标准**:
  1. `src/services/hand-service.ts` 实现 HandService
  2. addHandRecord(record): 添加手牌记录
  3. getHandsBySession(sessionId): 获取场次关联的手牌
  4. getHandsBySeason(seasonId): 获取赛季的手牌
  5. updateHandRecord(id, updates): 更新手牌记录
  6. deleteHandRecord(id): 删除手牌记录
  7. API Route `src/app/api/hands/route.ts` 实现完整 CRUD
  8. 手牌记录字段: id, date, seasonId, sessionId, players, handType, board, actions, result, winner, notes, tags, photo, createdAt
- **产出文件**: `src/services/hand-service.ts`, `src/app/api/hands/route.ts`

---

### T033: 手牌记录 UI (列表/表单/详情)

- **描述**: 实现手牌记录的列表、添加/编辑表单、详情查看页面
- **类型**: 新增
- **依赖**: T032
- **复杂度**: L
- **验收标准**:
  1. `src/components/poker/hand/hand-list.tsx` 手牌列表
     - 按日期倒序显示
     - 显示手牌类型、参与玩家、结果
     - 支持按标签筛选
  2. `src/components/poker/hand/hand-form.tsx` 添加/编辑表单
     - 选择关联场次（可选）
     - 输入手牌类型（AA/KK/QQ/ATs...）
     - 输入公共牌（flop/turn/river）
     - 添加行动路线（玩家+阶段+动作+金额）
     - 输入结果和赢家
     - 添加标签（bluff/value/hero call...）
     - 添加备注
  3. `src/components/poker/hand/hand-detail.tsx` 手牌详情
     - 展示完整手牌信息
     - 行动路线时间线展示
     - 支持编辑和删除
- **产出文件**: `src/components/poker/hand/hand-list.tsx`, `src/components/poker/hand/hand-form.tsx`, `src/components/poker/hand/hand-detail.tsx`

---

### T034: 扑克牌 SVG 渲染组件

- **描述**: 实现扑克牌的 SVG 渲染组件，用于手牌详情中的可视化展示
- **类型**: 新增
- **依赖**: T033
- **复杂度**: M
- **验收标准**:
  1. `src/components/poker/hand/hand-card-svg.tsx` 扑克牌 SVG 组件
  2. 支持渲染单张扑克牌（花色+点数）
  3. 支持 4 种花色: 黑桃/红心/方块/梅花
  4. 支持 13 种点数: A-K
  5. 支持背面朝上（未知牌）
  6. 支持小尺寸（手牌列表）和大尺寸（手牌详情）
  7. 纯 SVG 实现，无外部图片依赖
- **产出文件**: `src/components/poker/hand/hand-card-svg.tsx`

---

### T035: 腾讯文档集成 - 数据导入

- **描述**: 实现从腾讯文档在线表导入数据的功能，支持解析表格结构并写入本地数据库
- **类型**: 新增
- **依赖**: T005
- **复杂度**: L
- **验收标准**:
  1. `src/services/tencent-docs-service.ts` 实现 TencentDocsService
  2. 支持输入腾讯文档在线表链接
  3. 解析表格结构，识别日期、玩家、积分列
  4. 支持选择性导入特定日期范围
  5. 导入前预览数据，显示解析结果
  6. 导入时自动校验合计是否为零
  7. 合计不为零的场次标记为异常，提示用户
  8. 支持导入到当前赛季或新建赛季
  9. 优先支持 CSV 文件上传解析（无需 API 权限）
  10. API Route `src/app/api/tencent-docs/route.ts`
- **产出文件**: `src/services/tencent-docs-service.ts`, `src/app/api/tencent-docs/route.ts`

---

### T036: 腾讯文档集成 - 数据导出

- **描述**: 实现将本地数据导出到腾讯文档或 CSV 文件的功能
- **类型**: 新增
- **依赖**: T035
- **复杂度**: M
- **验收标准**:
  1. 支持导出为 CSV 文件
  2. CSV 包含列: 日期、场次、玩家、积分、赛季
  3. 支持按赛季筛选导出
  4. 导出文件名格式: `poker-tracker-赛季X-YYYY-MM-DD.csv`
  5. 导出成功后提示用户
  6. （可选）支持直接写入腾讯文档在线表
- **产出文件**: 修改 `src/services/tencent-docs-service.ts`

---

### T037: 玩家详情页增强

- **描述**: 增强玩家详情页，增加穿透分析、手牌记录、赛季对比等功能
- **类型**: 重构
- **依赖**: T030, T033
- **复杂度**: M
- **验收标准**:
  1. 玩家详情页显示: 基础统计 + 累计走势 + 单场记录（保留现有）
  2. 新增: 各赛季积分对比柱状图
  3. 新增: 关联手牌记录列表
  4. 新增: 克星/福星关系（与哪些玩家对局时盈亏最大）
  5. 新增: 最近趋势分析（上升/下降/平稳）
  6. 数据从 StatsService 和 HandService 获取
- **产出文件**: 修改 `src/components/poker/player/player-view.tsx` 或 `src/components/poker/ranking/player-drilldown.tsx`

---

### T038: "我的"页面实现

- **描述**: 实现"我的"Tab 页面，包含个人信息、赛季管理、数据备份、设置等功能
- **类型**: 新增
- **依赖**: T022, T021
- **复杂度**: M
- **验收标准**:
  1. 个人信息区: 设置当前玩家名称（用于默认录入）
  2. 赛季管理: 创建赛季、结束赛季、查看历史赛季
  3. 数据备份: JSON 导出、JSON 导入、CSV 导出
  4. 腾讯文档同步入口
  5. 设置: 清分阈值自定义、主题切换（保留现有深色主题）
  6. 个人偏好持久化到 localStorage
- **产出文件**: `src/components/poker/profile/` 目录下相关组件

---

## Phase 3: 跨平台与集成

> **目标**: Tauri 桌面端打包，完善体验
> **关键验证点**: 桌面端 App 可独立运行，离线可用，通知正常

---

### T039: Tauri 2.0 项目初始化

- **描述**: 在项目中初始化 Tauri 2.0，配置基本的项目结构和构建设置
- **类型**: 新增
- **依赖**: T026 (Phase 1 完成)
- **复杂度**: M
- **验收标准**:
  1. `src-tauri/` 目录创建，包含 Cargo.toml、tauri.conf.json
  2. Tauri 配置指向 Next.js 开发服务器 (localhost:3000)
  3. `pnpm tauri dev` 可启动桌面窗口
  4. 窗口标题为"德扑积分榜"
  5. 窗口尺寸 1200x800，可调整大小
  6. 安装包大小 < 10MB
  7. `package.json` 添加 `@tauri-apps/cli` 和 `@tauri-apps/api` 依赖
- **产出文件**: `src-tauri/` 目录

---

### T040: Tauri IPC Commands

- **描述**: 实现 Tauri Rust 后端的 IPC 命令，提供原生能力调用接口
- **类型**: 新增
- **依赖**: T039
- **复杂度**: M
- **验收标准**:
  1. `src-tauri/src/commands.rs` 实现核心 IPC 命令
  2. get_records / create_session / add_player_entry / confirm_session
  3. export_json / import_json
  4. save_image (保存分享图片到本地)
  5. 前端通过 `@tauri-apps/api` 的 `invoke` 调用
  6. 创建 `src/lib/tauri-bridge.ts` 封装 IPC 调用，自动检测是否在 Tauri 环境
  7. 非 Tauri 环境降级为 API Routes 调用
- **产出文件**: `src-tauri/src/commands.rs`, `src/lib/tauri-bridge.ts`

---

### T041: Tauri SQLite 集成

- **描述**: 在 Tauri Rust 后端集成 SQLite，通过 IPC 提供数据库操作能力
- **类型**: 新增
- **依赖**: T040
- **复杂度**: L
- **验收标准**:
  1. `src-tauri/src/database.rs` 实现 Rust 侧 SQLite 操作
  2. 使用 `rusqlite` 或 `tauri-plugin-sql`
  3. 数据库文件存储在 Tauri app data 目录
  4. IPC 命令直接操作 Rust 侧 SQLite，性能优于 JS 侧 better-sqlite3
  5. 前端通过 tauri-bridge.ts 调用
  6. 种子数据初始化在 Rust 侧完成
  7. 数据库迁移脚本在 Rust 侧实现
- **产出文件**: `src-tauri/src/database.rs`

---

### T042: 原生通知 (清分提醒)

- **描述**: 利用 Tauri 的原生通知能力，实现清分雷达的系统级通知
- **类型**: 新增
- **依赖**: T040
- **复杂度**: S
- **验收标准**:
  1. 使用 `tauri-plugin-notification` 实现系统通知
  2. 玩家余额达到清分阈值时发送系统通知
  3. 48小时未清分发送催办通知
  4. 通知点击可跳转到 App 对应页面
  5. 非 Tauri 环境降级为浏览器 Notification API
  6. 通知权限请求逻辑
- **产出文件**: 修改 `src/services/clear-radar-service.ts`, `src/lib/tauri-bridge.ts`

---

### T043: 原生文件系统 (导入导出)

- **描述**: 利用 Tauri 的文件系统 API，实现原生的文件选择和保存对话框
- **类型**: 新增
- **依赖**: T040
- **复杂度**: S
- **验收标准**:
  1. 使用 `tauri-plugin-dialog` 实现文件选择/保存对话框
  2. JSON 导出: 弹出保存对话框，用户选择保存位置
  3. JSON 导入: 弹出文件选择对话框，用户选择备份文件
  4. CSV 导出: 弹出保存对话框
  5. 分享图片保存: 弹出保存对话框
  6. 非 Tauri 环境降级为浏览器下载
- **产出文件**: 修改 `src/services/import-export-service.ts`, `src/services/share-service.ts`

---

### T044: 桌面端构建与测试

- **描述**: 配置桌面端构建流程，生成 Windows/macOS 安装包，进行端到端测试
- **类型**: 新增
- **依赖**: T041, T042, T043
- **复杂度**: M
- **验收标准**:
  1. `pnpm tauri build` 成功生成安装包
  2. Windows 生成 .msi 安装包
  3. macOS 生成 .dmg 安装包
  4. 安装包大小 < 15MB
  5. 安装后 App 可正常启动
  6. 所有功能离线可用
  7. 数据持久化正常（关闭重开数据不丢失）
  8. 系统通知正常
  9. 文件导入导出正常
  10. 冷启动时间 < 2 秒
- **产出文件**: 构建配置、安装包

---

### T045: 全量回归测试与发布准备

- **描述**: 对所有功能进行全量回归测试，修复 bug，准备 v1.0 发布
- **类型**: 新增
- **依赖**: T044
- **复杂度**: M
- **验收标准**:
  1. 所有 P0 功能测试通过
  2. 所有 P1 功能测试通过
  3. 无 P0/P1 级别 bug
  4. 性能指标达标: 冷启动<2s、录入保存<500ms、汇总计算<200ms
  5. 数据迁移测试: 从旧版 Supabase 数据迁移到 SQLite
  6. 异常场景测试: 数据库损坏恢复、导入异常数据、网络断开
  7. 多平台测试: Windows + macOS（如有条件）
  8. 更新 README.md 中的使用说明
- **产出文件**: 测试报告、发布说明

---

## 依赖关系总览

```
Phase 0 (基础架构)
  T001 安装依赖
    +-- T002 SQLite Schema
    |     +-- T003 表关系
    |     +-- T004 数据库连接
    |           +-- T005 CRUD层
    |                 +-- T006 种子数据
    |                 +-- T008 Record Store
    |                 +-- T009 Season/Settlement Store
    |                 +-- T010 API Routes
    |                 +-- T022 JSON导入导出
    |                 +-- T032 手牌CRUD
    |                 +-- T035 腾讯文档导入
  T001 +-- T007 UI Store
  T005 + T007 + T008 + T009 + T010
    +-- T011 重构page.tsx
          +-- T024 常量整理
  T010 + T011
    +-- T012 移除Supabase

Phase 1 (P0核心)
  T005 +-- T013 GameSession模型
  |       +-- T014 多人协作录入UI
  |       |     +-- T016 录入状态+校验组件
  |       +-- T015 场次列表+卡片
  |       +-- T027 统计服务提取
  |       +-- T014 + T015 + T016
  |             +-- T017 场次确认流程
  |                   +-- T018 分享图生成
  T009 +-- T019 清分雷达引擎
  |       +-- T020 清分雷达UI
  |       +-- T021 赛季全清流程
  T018 + T020
    +-- T023 首页重构(5Tab)
          +-- T025 公共组件提取
  T023 + T024 + T025
    +-- T026 集成测试

Phase 2 (P1增强)
  T013 +-- T027 统计服务
  |       +-- T028 龙虎榜+胜率榜
  |       +-- T029 清分榜+出勤榜
  |       +-- T031 扩展奖项
  T028 + T029
    +-- T030 数据穿透
          +-- T037 玩家详情增强
  T032 +-- T033 手牌UI
  |       +-- T034 扑克牌SVG
  T035 +-- T036 腾讯文档导出
  T022 + T021 +-- T038 "我的"页面

Phase 3 (跨平台)
  T026 +-- T039 Tauri初始化
          +-- T040 IPC Commands
                +-- T041 SQLite集成
                +-- T042 原生通知
                +-- T043 原生文件系统
                      +-- T044 桌面端构建
                            +-- T045 全量回归测试
```

---

## 风险与注意事项

1. **better-sqlite3 原生模块兼容**: 在 Tauri 环境中可能遇到 Node.js 原生模块兼容问题。备选方案: T041 中使用 Rust 侧 SQLite。
2. **数据迁移**: 从 Supabase 迁移到 SQLite 时，需确保种子数据完整且一致。T006 需要仔细验证。
3. **多人协作录入**: v1.0 先实现"同设备轮流录入"模式，局域网同步为 v1.x 规划。
4. **html2canvas 深色主题**: 可能出现渲染偏差，T018 需要提前测试。
5. **腾讯文档 API**: 权限和频率限制可能影响体验，T035 优先支持 CSV 导入。

---

*文档结束*
