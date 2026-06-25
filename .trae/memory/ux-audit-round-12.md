# UX/交互审计 · 第 12 轮

**日期**: 2026-06-24
**范围**: Coach UI 子组件、导入导出服务、牌面解析函数蔓延
**方法**: 代码静态分析 + 重复代码取证 + 数据完整性审查

---

## 一、不便于操作（2 项）

### 🔴 [OP-40] `parseCardCode` 在 5 个不同文件中各自独立实现
- **文件**: 
  1. `poker-engine.ts:64` — `parseCardCode()` → `Card | null` (数字编码)
  2. `card-selector.tsx` — re-export from poker-engine
  3. `hand-page.tsx:54` — 内联 `board.split(" ").map(parseCardCode)` 
  4. **`board-area.tsx:12-22`** — 完整独立实现 → `{suit, rank} | null`
  5. **`hole-cards.tsx:11-21`** — **逐字相同的独立实现** → `{suit, rank} | null`
  
- **问题**: `board-area.tsx` 和 `hole-cards.tsx` 中的 `parseCardCode` 是**完全相同**的代码（逐字copy-paste）。再加上 `poker-engine.ts` 的原版和 `quick-entry-wizard.tsx` 的 `cardName` 本地副本，项目中有 **5 个位置**各自实现了牌面字符串解析。任何一个解析逻辑的 bug 需要在 5 处修复。
- **修复**: 在 `poker-card.tsx` 中导出统一的 `parseCardCode()` 函数（兼容 `{suit, rank}` 返回格式），所有 coach 组件和 UI 组件从此处导入。

---

## 二、交互逻辑弱（3 项）

### 🔴 [IX-51] `importFromJSON` 导入时所有记录强制归属第一个赛季，丢弃 sessionId
- **文件**: `import-export-service.ts:149-163`
- **问题**:
  ```ts
  const records = data.pokerRecords.map((r) => ({
    ...
    seasonId: (data.seasons[0]?.id) || "",  // 硬编码第一个赛季!
    sessionId: null as string | null,         // 丢弃所有 session 关联!
    status: "confirmed" as const,
  }))
  ```
  用户导出时记录了每场记录的赛季和场次信息，但**导入时全部丢失**——所有记录变成第一个赛季的孤儿记录（无 session 关联）。这等于**导入导出是单向数据破坏**：导出 → 导入 → 数据结构被破坏。
- **修复**: 导出时保留 `seasonId` 和 `sessionId`，导入时原样恢复。

### 🔴 [IX-52] `importFromJSON` 所有 DB 操作用空 `catch {}` 静默吞错
- **文件**: `import-export-service.ts:135,146,162,174,186,201,223`
- **问题**: 7 个 `try { insertXxx() } catch {}` 块。如果 season 插入失败（如唯一约束冲突），导入继续执行但 `seasonCount` 不计入。最终返回"导入成功：0 赛季、50 记录"——**用户看到"成功"但数据可能只导入了部分**，且无法知道哪些失败了。
- **修复**: 收集错误信息并在返回消息中报告，或使用事务确保全量或全不导入。

### 🟡 [IX-53] 导出 `pokerRecords` 时不保留 `id`/`seasonId`/`sessionId`/`status`/`createdAt`
- **文件**: `import-export-service.ts:54-59`
- **问题**: 导出时将完整 DB 记录（11+ 字段）映射为旧版 4 字段格式（`date, player, score, win`），丢弃了 `id`、`seasonId`、`sessionId`、`status`、`createdAt`。这与 [[UX-Audit-Round-6]] 的 FE-23（双轨类型）直接关联——导出使用了 `data.ts` 的旧版类型。
- **修复**: 导出完整字段，保持数据完整性。

---

## 三、功能延申不合理（1 项）

### 🟡 [FE-45] `exportToJSON` 导出所有数据表但 `importFromJSON` 的导入顺序无外键约束处理
- **文件**: `import-export-service.ts:109-237`
- **问题**: 导入顺序是 seasons → sessions → records → settlements → clears → awards → hands。但如果 sessions 引用了某 season 的 id，而该 season 插入失败（被 `catch {}` 吞掉），后续 sessions 插入会引用不存在的 season id（SQLite 外键约束可能失败，取决于 `foreign_keys = ON` 设置）。没有事务包裹，部分成功部分失败会导致数据不一致。
- **修复**: 用 `db.transaction()` 包裹整个导入流程，或在导入前验证所有外键引用完整性。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 1 | 0 | 0 | 1 |
| 交互逻辑弱 | 2 | 1 | 0 | 3 |
| 功能延申不合理 | 0 | 1 | 0 | 1 |
| **合计** | **3** | **2** | **0** | **5** |

### 本轮最严重发现

1. **[IX-51]** 导入时丢弃 seasonId/sessionId — 数据完整性破坏
2. **[IX-52]** 7 个空 `catch {}` 静默吞所有导入错误 — 用户不知数据不完整
3. **[OP-40]** 5 个独立 `parseCardCode` 实现 — copy-paste 蔓延
4. **[IX-53]** 导出丢失 5 个关键字段 — 导出非完整备份
5. **[FE-45]** 导入无事务 — 部分成功部分失败

### 📈 累计进度

| 轮次 | 新 | 累计 | 🔴 |
|------|-----|------|-----|
| 1-12 | 5 | **138** | **53** |
