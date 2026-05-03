# 快速手牌录入 (Quick Hand Entry) 功能开发任务

## 项目概述

为 Poker Tracker 应用添加"快速记录"模式，与现有的"完整记录"模式并列。用户可以通过快速模式在 3 步内记录一局手牌（手牌 → 结果 → 标签），未完成的手牌会显示橙色标记，后续可通过完整的 HandWizard 补全信息。

### 核心约束
- **绝不修改** 现有的 `hand-wizard.tsx` 文件及其内部逻辑
- 快速记录是完整记录的简化入口，两者共享保存通道
- 数据库新增 `isComplete` 和 `quickMode` 两个字段来区分记录状态

### 技术栈
- Next.js 16 (App Router) + React 19 + TypeScript
- Drizzle ORM (SQLite)
- Zustand (状态管理)
- shadcn/ui

### 任务拆解策略
按依赖关系从底层到上层排列：数据库 Schema → TypeScript 类型 → CRUD 层 → API 路由 → Service 层 → Zustand Store → UI 组件 → 页面整合。

---

## Task 1: 数据库 Schema 新增 `isComplete` 和 `quickMode` 字段

### 任务目标
在 `handRecords` 表中添加 `isComplete`（是否完整）和 `quickMode`（是否快速模式）两个字段。

### 背景与上下文
- 当前 `handRecords` 表定义在 [schema.ts](file:///d:/02工作/texa/poker-tracker/src/storage/database/shared/schema.ts#L97-L121)
- 新增字段用于区分"快速录入的草稿手牌"和"通过完整向导录入的完整手牌"
- `isComplete` 默认值为 `false`（快速录入的手牌初始为不完整）
- `quickMode` 默认值为 `false`（通过 HandWizard 录入的标记为 false）

### 详细要求
1. 在 [schema.ts](file:///d:/02工作/texa/poker-tracker/src/storage/database/shared/schema.ts#L97) 的 `handRecords` 表中添加以下字段：
   - `isComplete`: `integer("is_complete", { mode: "boolean" }).notNull().default(false)`
   - `quickMode`: `integer("quick_mode", { mode: "boolean" }).notNull().default(false)`
2. 为新字段添加数据库索引：
   - `index("hand_records_complete_idx").on(table.isComplete)`
   - `index("hand_records_quick_idx").on(table.quickMode)`

### 技术约束
- 使用 Drizzle ORM 的 `sqliteTable` API
- 字段使用 `{ mode: "boolean" }` 以自动处理 SQLite integer ↔ boolean 转换
- `default(false)` 确保已有记录（通过 Drizzle 迁移或手动插入）的向后兼容

### 验收标准
- [ ] `handRecords` schema 包含 `isComplete` 和 `quickMode` 字段
- [ ] 两个字段均有正确的默认值和类型
- [ ] 新增索引定义正确
- [ ] TypeScript 编译通过（`npx tsc --noEmit` 无报错）
- [ ] 不影响任何现有 CRUD 函数

---

## Task 2: 更新 `HandRecord` TypeScript 类型定义

### 任务目标
在 `HandRecord` 接口中添加 `isComplete` 和 `quickMode` 字段。

### 背景与上下文
- `HandRecord` 接口定义在 [types.ts](file:///d:/02工作/texa/poker-tracker/src/lib/types.ts#L33-L49)
- Task 1 已完成数据库 schema 的修改
- 此接口在 Service 层、API 路由、和 UI 组件中广泛使用

### 详细要求
1. 在 [types.ts](file:///d:/02工作/texa/poker-tracker/src/lib/types.ts#L33) 的 `HandRecord` 接口中添加：
   ```typescript
   isComplete: boolean   // 标记手牌信息是否完整
   quickMode: boolean    // 标记是否通过快速模式录入
   ```
2. 将这两个字段设为**非可选**（必填），因为数据库有默认值
3. 同时更新 `ExportData` 接口中 `handRecords` 的类型（如果使用了旧版 `HandRecord[]`）

### 技术约束
- 字段类型为 `boolean`（非 `boolean?`），因为 schema 有 `notNull().default()`
- 保持现有字段的可选性不变

### 验收标准
- [ ] `HandRecord` 接口包含 `isComplete: boolean` 和 `quickMode: boolean`
- [ ] TypeScript 编译通过
- [ ] 所有引用 `HandRecord` 的地方不需要修改（新字段有默认值）

---

## Task 3: CRUD 层新增 `isComplete` 查询支持和批量操作

### 任务目标
在 CRUD 层添加按 `isComplete` 过滤的查询函数，以及批量查询快捷函数。

### 背景与上下文
- CRUD 函数定义在 [crud.ts](file:///d:/02工作/texa/poker-tracker/src/storage/database/crud.ts#L217-L251) 的 "Hand Records" 区域
- 现有函数：`getAllHands()`, `getHandsBySession()`, `getHandsBySeason()`
- 需要新增按完成状态过滤的能力

### 详细要求
1. 新增 `getIncompleteHands(seasonId?: string)` 函数：
   - 查询 `isComplete = false` 的手牌
   - 可选按 `seasonId` 过滤
   - 按 `createdAt` 降序排列
2. 新增 `getHandsByCompleteStatus(isComplete: boolean, seasonId?: string)` 函数：
   - 通用按完成状态查询
   - 可选按 `seasonId` 过滤
3. 确保 `insertHandRecord` 能正确接收 `isComplete` 和 `quickMode` 字段（因为 Drizzle 的 `$inferInsert` 会自动包含新字段，通常无需修改）

### 技术约束
- 使用 Drizzle 的 `eq()` 进行条件过滤
- 使用 `and()` 组合多个条件
- 返回类型使用 `HandRecordDB[]`（`typeof handRecords.$inferSelect`）

### 验收标准
- [ ] `getIncompleteHands()` 函数正确返回未完成的手牌
- [ ] `getHandsByCompleteStatus()` 函数按参数正确过滤
- [ ] 现有函数（`getAllHands`, `getHandsBySeason`, `getHandsBySession`）行为不变
- [ ] TypeScript 编译通过

---

## Task 4: API 路由添加 `is_complete` 查询参数支持

### 任务目标
在 `/api/hands` GET 接口中添加 `is_complete` 查询参数，支持按完成状态过滤。

### 背景与上下文
- API 路由定义在 [route.ts](file:///d:/02工作/texa/poker-tracker/src/app/api/hands/route.ts)
- 现有 GET 支持 `season_id` 和 `session_id` 参数
- Task 3 已完成 CRUD 层的新增函数

### 详细要求
1. 在 GET handler 中添加 `is_complete` 查询参数解析：
   - `is_complete=true` → 只返回完整手牌
   - `is_complete=false` → 只返回不完整手牌
   - 不传此参数 → 返回所有手牌（保持现有行为）
2. 参数组合支持：
   - `?season_id=xxx&is_complete=false` → 某赛季下的未完成手牌
   - `?is_complete=false` → 全局未完成手牌
3. 使用 Task 3 新增的 CRUD 函数实现过滤逻辑

### 技术约束
- 使用 `URLSearchParams` 解析参数（`searchParams.get("is_complete")`）
- 参数值为字符串 `"true"` 或 `"false"`，需转为 boolean
- 保持现有返回格式 `{ success: boolean, data: HandRecordDB[] }`

### 验收标准
- [ ] `GET /api/hands?is_complete=false` 只返回未完成手牌
- [ ] `GET /api/hands?is_complete=true` 只返回完成手牌
- [ ] `GET /api/hands` 不加参数时行为不变（返回全部）
- [ ] 参数组合（如 `season_id` + `is_complete`）正常工作
- [ ] 现有 POST/PUT/DELETE handler 不受影响

---

## Task 5: Service 层更新以支持新字段

### 任务目标
更新 `hand-service.ts` 以支持 `isComplete` 过滤查询和快速模式标识。

### 背景与上下文
- Service 定义在 [hand-service.ts](file:///d:/02工作/texa/poker-tracker/src/services/hand-service.ts)
- 现有函数：`createHand()`, `getHands()`, `updateHand()`, `deleteHand()`
- `getHands()` 目前只接受 `seasonId` 和 `sessionId` 参数

### 详细要求
1. 更新 `getHands()` 函数签名，新增可选参数：
   ```typescript
   export function getHands(seasonId?: string, sessionId?: string, isComplete?: boolean): HandRecord[]
   ```
   - 当 `isComplete` 为 `true`/`false` 时，使用 Task 3 的 `getHandsByCompleteStatus()`
   - 当 `isComplete` 为 `undefined` 时，保持现有行为
2. 新增 `getIncompleteHands(seasonId?: string): HandRecord[]` 快捷函数，直接调用 CRUD 层的同名函数
3. 确保 `createHand()` 能透传 `isComplete` 和 `quickMode` 字段（Drizzle `$inferInsert` 自动支持）

### 技术约束
- 保持现有调用向后兼容（可选参数）
- 返回类型保持 `HandRecord[]`

### 验收标准
- [ ] `getHands()` 新增的 `isComplete` 参数正确工作
- [ ] 不传 `isComplete` 时行为与之前完全一致
- [ ] `getIncompleteHands()` 正确返回未完成手牌
- [ ] TypeScript 编译通过
- [ ] 现有调用方（如果有）不受影响

---

## Task 6: 创建 `quick-entry-store.ts` Zustand Store

### 任务目标
创建快速录入专用的 Zustand Store，管理快速录入的临时状态。

### 背景与上下文
- 现有 Store 参考 [record-store.ts](file:///d:/02工作/texa/poker-tracker/src/stores/record-store.ts)
- 快速录入流程为 3 步：选择手牌 → 录入结果 → 添加标签
- 需要独立 Store 以避免与完整向导状态混淆

### 详细要求
1. 创建文件 `src/stores/quick-entry-store.ts`
2. Store 接口定义：
   ```typescript
   interface QuickEntryState {
     // 步骤控制
     currentStep: 0 | 1 | 2  // 0=选牌, 1=结果, 2=标签
     isOpen: boolean          // 快速录入面板是否打开

     // Step 0: 手牌
     heroCards: string[]      // 手牌代码数组，如 ["As", "Kh"]
     boardCards: string[]     // 公共牌代码数组

     // Step 1: 结果
     result: number           // 积分结果
     winner: string           // 赢家位置

     // Step 2: 标签
     notes: string            // 笔记
     tags: string[]           // 标签列表

     // 关联信息
     sessionId: string | null // 关联场次
     handId: string | null    // 已有手牌ID（补全模式下使用）
   }

   interface QuickEntryActions {
     open: () => void
     close: () => void
     reset: () => void
     nextStep: () => void
     prevStep: () => void
     setHeroCards: (cards: string[]) => void
     setBoardCards: (cards: string[]) => void
     setResult: (result: number) => void
     setWinner: (winner: string) => void
     setNotes: (notes: string) => void
     setTags: (tags: string[]) => void
     setSessionId: (sessionId: string | null) => void
     setHandId: (handId: string | null) => void  // 补全模式
   }
   ```
3. `reset()` 将所有状态恢复为初始值
4. `close()` 自动调用 `reset()`
5. `nextStep()` 和 `prevStep()` 需要边界检查（不能越界）

### 技术约束
- 使用 `zustand` 的 `create()` API
- 初始值：`currentStep: 0`, `isOpen: false`, `heroCards: []`, `boardCards: []`, `result: 0`, `winner: ""`, `notes: ""`, `tags: []`, `sessionId: null`, `handId: null`
- 导出 hook：`export const useQuickEntryStore = create<...>()`

### 验收标准
- [ ] Store 正确定义所有 state 和 actions
- [ ] `nextStep()` / `prevStep()` 有正确的边界检查
- [ ] `close()` 自动重置所有状态
- [ ] `setHandId()` 用于补全模式（从 incomplete hand 打开时设置）
- [ ] TypeScript 编译通过

---

## Task 7: 创建 `quick-entry-wizard.tsx` 组件

### 任务目标
创建快速录入向导组件，包含 3 个步骤：选择手牌 → 录入结果 → 添加标签。

### 背景与上下文
- 现有 UI 组件参考 [hand-wizard.tsx](file:///d:/02工作/texa/poker-tracker/src/components/poker/hand/hand-wizard.tsx)（**仅参考风格，不可修改此文件**）
- 牌面选择复用现有的 `CardSelector` 组件（来自 [card-selector.tsx](file:///d:/02工作/texa/poker-tracker/src/components/poker/hand/card-selector.tsx)）
- 使用 `poker-engine.ts` 中的 `makeCard`, `parseCardCode`, `cardName`, `Card` 类型
- 使用 Task 6 创建的 `useQuickEntryStore`

### 详细要求
1. 创建文件 `src/components/poker/hand/quick-entry-wizard.tsx`

2. **Props 接口**：
   ```typescript
   interface QuickEntryWizardProps {
     onSave: (data: QuickEntrySaveData) => void
     onCancel: () => void
     initialData?: {        // 补全模式时传入
       id: string
       heroCards: string[]
       boardCards: string[]
       result: number
       winner: string
       notes: string
       tags: string
       sessionId?: string
     }
   }

   interface QuickEntrySaveData {
     heroCards: string[]    // 手牌代码
     boardCards: string[]   // 公共牌代码
     result: number         // 积分
     winner: string         // 赢家
     notes: string          // 笔记
     tags: string           // 逗号分隔的标签字符串
     sessionId?: string
     handId?: string        // 补全时传入已有ID
   }
   ```

3. **Step 0 - 选择手牌**：
   - Hero 手牌选择器（2张）：使用 `CardSelector`，`maxCards={2}`
   - 公共牌选择器（可选，最多5张）：
     - Flop 区（3张）
     - Turn 区（1张）
     - River 区（1张）
   - 显示已选牌的防重复逻辑（使用 `usedCards` 计算）
   - "下一步"按钮，要求至少选择 2 张 Hero 手牌

4. **Step 1 - 录入结果**：
   - 积分输入框（number input，正数=赢，负数=输）
   - 赢家选择器（简单文本输入，如 "CO", "BTN", "UTG" 等）
   - "上一步"和"下一步"按钮

5. **Step 2 - 添加标签**：
   - 笔记文本域（textarea）
   - 标签输入（逗号分隔的文本输入，提供常用标签快捷按钮如：诈唬、价值、Hero Call、弃牌给3-bet等）
   - "上一步"和"保存"按钮

6. **顶部步骤指示器**：
   - 显示 3 个步骤：`① 手牌 → ② 结果 → ③ 标签`
   - 当前步骤高亮，已完成步骤显示 ✓

7. **交互逻辑**：
   - 使用 `useQuickEntryStore` 管理中间状态
   - `onSave` 回调将数据传递给父组件
   - `onCancel` 调用 Store 的 `close()`
   - 补全模式（有 `initialData`）时，预填所有字段

### 技术约束
- 使用 shadcn/ui 的 `Button`, `Input`, `Textarea`, `Card` 组件
- 复用 `CardSelector` 和 `CardDisplay` 组件（从 `./card-selector` 导入）
- 使用 `makeCard` 和 `parseCardCode` 处理牌面字符串
- 组件使用 `"use client"` 指令
- 样式与现有 `hand-wizard.tsx` 保持一致（深色主题、圆角边框、渐变背景等）
- **绝对不可修改 `hand-wizard.tsx`**

### 验收标准
- [ ] 3 步流程完整可用
- [ ] 步骤指示器正确显示当前进度
- [ ] 牌面选择有防重复逻辑
- [ ] 补全模式下数据正确预填
- [ ] "保存"正确调用 `onSave` 回调
- [ ] "取消"正确调用 `onCancel` 回调
- [ ] 常用标签快捷按钮可用
- [ ] TypeScript 编译通过，无类型错误

---

## Task 8: 更新 `hand-page.tsx` 实现双按钮、橙色标记和补全流程

### 任务目标
整合快速录入手牌到 `hand-page.tsx`，实现：双模式按钮、未完成手牌橙色标记、点击"补全"打开 HandWizard、保存时区分 POST/PUT。

### 背景与上下文
- 当前 `hand-page.tsx` 定义在 [hand-page.tsx](file:///d:/02工作/texa/poker-tracker/src/components/poker/hand/hand-page.tsx)
- 现有逻辑：单个"记录手牌"按钮 → 打开 `HandWizard` → POST 创建
- 需要改造为：
  - 两个按钮："快速记录"（橙色）和"完整记录"（默认色）
  - 手牌列表中未完成的手牌显示橙色标记
  - 未完成手牌旁有"补全"按钮 → 打开 HandWizard 并传入已有数据 → PUT 更新
  - 快速记录保存后，可通过"补全"进一步完善

### 详细要求

#### 8.1 加载未完成手牌
1. 组件挂载时，通过 `GET /api/hands?is_complete=false` 加载未完成手牌
2. 将未完成手牌存储为本地 state：`incompleteHands: HandRecord[]`

#### 8.2 双按钮
1. 将原来的单个"记录手牌"按钮替换为两个按钮：
   ```
   [快速记录]  [完整记录]
   ```
   - "快速记录"：橙色主题 (`bg-orange-500/20 text-orange-400 border-orange-500/40`)
   - "完整记录"：默认主题（保持原样）
2. 点击"快速记录"：
   - 设置 `showQuickEntry = true`
   - 打开 `QuickEntryWizard`
3. 点击"完整记录"：
   - 设置 `showWizard = true`
   - 打开 `HandWizard`（现有逻辑不变）

#### 8.3 未完成手牌橙色标记
1. 在手牌列表顶部或每个未完成手牌卡片旁显示橙色提示
2. 未完成手牌卡片添加橙色左边框（`border-l-2 border-l-orange-500`）
3. 显示 "⚠️ 待补全" 标签（橙色 badge）

#### 8.4 补全流程
1. 未完成手牌卡片上添加"补全"按钮
2. 点击"补全"：
   - 打开 `HandWizard`（**不是** QuickEntryWizard）
   - 传入已有数据（手牌、公共牌、结果、笔记、标签等）作为初始值
   - 设置 `editingHandId = hand.id` 标记为编辑模式
3. HandWizard 保存时：
   - 如果 `editingHandId` 有值 → 调用 `PUT /api/hands` 进行更新
   - 如果 `editingHandId` 无值 → 调用 `POST /api/hands` 进行创建
4. PUT 请求体中需要包含 `id`, `isComplete: true`, 以及所有更新的字段

#### 8.5 快速记录保存逻辑
1. `QuickEntryWizard` 的 `onSave` 回调：
   - 构建请求体（与现有 `handleSave` 类似，但来自 QuickEntry 数据）
   - 如果 `handId` 有值（补全模式）→ `PUT /api/hands`，设置 `isComplete: true`
   - 如果 `handId` 无值 → `POST /api/hands`，设置 `isComplete: false`, `quickMode: true`
2. 保存成功后：
   - 从 `incompleteHands` 中移除已保存的手牌
   - 添加到 `savedHands` 列表
   - 显示成功提示

#### 8.6 状态管理
新增以下 local state：
```typescript
const [showQuickEntry, setShowQuickEntry] = useState(false)
const [incompleteHands, setIncompleteHands] = useState<HandRecord[]>([])
const [editingHandId, setEditingHandId] = useState<string | null>(null)
const [isCompleteMode, setIsCompleteMode] = useState(false) // 区分是新建补全还是快速保存
```

### 技术约束
- 保持现有 `HandWizard` 的渲染逻辑不变（不修改 `hand-wizard.tsx`）
- 通过 props 向 `HandWizard` 传递初始数据（如果 HandWizard 不支持初始数据，需要在 `hand-page` 层面做数据适配）
- API 调用使用现有的 `fetch` 模式
- 橙色标记使用 Tailwind CSS：`border-l-2 border-l-orange-500`、`text-orange-400`、`bg-orange-500/10`
- 确保快速记录和完整记录的保存回调都是 `useCallback` 包裹

### 验收标准
- [ ] 页面显示"快速记录"和"完整记录"两个按钮
- [ ] "快速记录"按钮为橙色主题
- [ ] 点击"快速记录"打开 `QuickEntryWizard`
- [ ] 点击"完整记录"打开 `HandWizard`（行为与改造前完全一致）
- [ ] 未完成手牌显示橙色左边框和"⚠️ 待补全"标签
- [ ] 点击"补全"按钮打开 `HandWizard` 并预填数据
- [ ] 补全后保存调用 PUT 请求，设置 `isComplete: true`
- [ ] 快速记录新建调用 POST 请求，设置 `isComplete: false`, `quickMode: true`
- [ ] 保存成功后列表正确更新
- [ ] TypeScript 编译通过

---

## 依赖关系图

```
Task 1: Schema 新增字段
  |
  v
Task 2: 类型定义更新
  |
  +--------+
  |        |
  v        v
Task 3: CRUD    Task 6: Store
  |              |
  v              v
Task 4: API    Task 7: QuickEntryWizard
  |              |
  v              |
Task 5: Service  |
  |              |
  +------+-------+
         |
         v
   Task 8: hand-page.tsx 整合
```

## 任务执行顺序

1. **Task 1** → 数据库 Schema
2. **Task 2** → TypeScript 类型
3. **Task 3** → CRUD 查询函数
4. **Task 4** → API 路由（依赖 Task 3）
5. **Task 5** → Service 层（依赖 Task 3）
6. **Task 6** → Zustand Store（可与 Task 3-5 并行）
7. **Task 7** → QuickEntryWizard 组件（依赖 Task 6）
8. **Task 8** → hand-page.tsx 整合（依赖 Task 4, 5, 7）
