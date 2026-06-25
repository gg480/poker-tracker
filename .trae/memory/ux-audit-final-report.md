# 🏁 UX/交互审计 · 终审报告

**日期**: 2026-06-24
**范围**: poker-tracker + poker-weapp 全项目
**方法**: 15 轮递进式代码静态分析 + 交互逻辑审查 + 数据流追踪 + 安全审查
**总发现问题数**: **146**（53 高优先级 / 64 中优先级 / 29 低优先级）

---

## 一、按类别的分布

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|:---:|:---:|:---:|:---:|
| 不便于操作 (OP) | 21 | 17 | 8 | **46** |
| 交互逻辑弱 (IX) | 15 | 20 | 8 | **43** |
| 功能延申不合理 (FE) | 17 | 17 | 13 | **47** |
| **合计** | **53** | **54** | **29** | **136** |

> 注：另有 10 项跨轮次系统模式描述，不计入独立问题数。

---

## 二、Top 20 高优先级问题（按严重程度排序）

### 🚨 数据安全与完整性

| # | 编号 | 问题 | 位置 |
|---|------|------|------|
| 1 | IX-51 | 导入时丢弃 seasonId/sessionId — 数据完整性破坏 | `import-export-service.ts:149` |
| 2 | IX-14 | AI API Key 明文经过后端 — 隐私红线 | `ai-analysis.tsx → route.ts` |
| 3 | IX-52 | 7 个空 `catch {}` 静默吞所有导入错误 | `import-export-service.ts` |
| 4 | OP-20 | `/api/seed` POST 无认证 — 可远程清空数据库 | `seed/route.ts` |
| 5 | OP-31 | AI API Key 存 localStorage — XSS 可窃取 | `ai-config-store.ts` |

### 🏗️ 架构碎片化

| # | 编号 | 问题 | 位置 |
|---|------|------|------|
| 6 | FE-36 | 教练模块 3 层架构全部互不相通 | coach-schema + coach-service + coach-store |
| 7 | FE-35 | coach-service.ts 从 5 个不存在模块导入 — 可能编译失败 | `coach-service.ts:29` |
| 8 | FE-23 | 14 个文件依赖遗留 `data.ts` — Phase 0 重构半途而废 | 全项目 |
| 9 | IX-20 | 双轨类型系统（data.ts vs types.ts） — 同一名字不同字段 | `data.ts` / `types.ts` |
| 10 | OP-12 | `getHands()` 无参数时永不返回数据 — 静默 bug | `hand-service.ts:37` |

### 🔇 静默失败

| # | 编号 | 问题 | 位置 |
|---|------|------|------|
| 11 | OP-01 | QuickEntryWizard 3 步全静默失败 | `quick-entry-wizard.tsx` |
| 12 | IX-01 | QuickEntryWizard 三步缺验证反馈 | 同上 |
| 13 | IX-02 | API 错误后关闭 wizard — 用户数据丢失 | `hand-page.tsx` |
| 14 | IX-29 | 两套独立清分雷达实现（DB vs Excel） | `clear-radar-service` vs `clear-radar-alerts` |

### 🔒 产品可用性

| # | 编号 | 问题 | 位置 |
|---|------|------|------|
| 15 | FE-27 | 小程序 60% Tab 页面是静态桩 | poker-weapp |
| 16 | IX-42 | 小程序 ALL 5 子包页面为桩 | poker-weapp |
| 17 | FE-06 | 教练模块 14 UI 组件 + 6 API 全用 Math.random() | coach-store.ts |
| 18 | OP-30 | 自定义扑克组件零无障碍支持 | hand-wizard, quick-entry 等 |
| 19 | OP-27 | ScoreDisplay 零使用 — 14 处重复内联颜色 | 全项目 |
| 20 | OP-16 | 零测试覆盖 — 核心逻辑无安全保障 | 全项目 |

---

## 三、系统性模式（跨问题集群）

### 模式 A：双轨系统（8 处）

同一个概念有多套独立实现：
- 类型：`data.ts` PokerRecord (4字段) vs `types.ts` PokerRecord (11字段)
- 清分：DB `clear-radar-service` vs Excel `clear-radar-alerts`
- UI：Web (Next.js) vs 小程序 (Taro) — 独立 Store/Service/后端
- 牌面：SVG PokerCard vs Tailwind CardDisplay
- GTO：gto-engine.ts vs coach-store mock
- 解析：`parseCardCode` × 5 个独立实现
- 排行榜：5 个组件各自排序
- 样式：Tailwind vs SCSS Modules

**影响**: Bug fix 需在 N 处同步；类型不安全；新开发者困惑。

### 模式 B：空壳/桩功能（11 处）

功能表面存在但实际不可用：
- 小程序 10/13 页面
- Coach 全部 3 层
- 3 个通用组件 (MedalBadge/PlayerSelect/DatePicker)
- ScoreDisplay 组件
- BoardDisplay 组件
- `gradient-shimmer` / `gold-glow` CSS 类
- AWS S3 SDK
- 多个 Radix 包
- coach DB 3 张表

**影响**: 代码体积膨胀；用户期望落空；维护负担。

### 模式 C：静默失败/无反馈（8 处）

错误发生但不通知用户：
- QuickEntryWizard 按钮禁用无解释
- getHands 空返回（bug）
- API 降级到种子数据无提示
- 导入 7 个空 catch
- CardSelector 超限静默阻止
- import-status loadStatus 无错误处理
- 保存失败后 wizard 关闭
- /api/seed 降级无警告

**影响**: 用户困惑 → 不信任产品。

### 模式 D：硬编码/泄露（6 处）

- Windows 路径 `D:\\02工作\\texa\\数据`（3 文件）
- AI 预设含开发者朋友名
- 种子数据 20+ 真实姓名
- 小程序硬编码 "2026 春季赛"
- 小程序硬编码 "Sprint 2"
- CLEAR_THRESHOLD 重复定义

---

## 四、按子系统的健康度评分

| 子系统 | 健康度 | 评语 |
|--------|:---:|------|
| poker-engine.ts | 🟢 9/10 | 专业级扑克引擎，仅被 1 组件使用 |
| award-service.ts | 🟢 8/10 | 声明式奖项系统，仅被 1 处使用 |
| session-service.ts | 🟢 8/10 | 完整的状态机 |
| card-selector.tsx | 🟡 6/10 | 功能完整，缺无障碍 |
| hand-wizard.tsx | 🟡 6/10 | 功能完整，GTO 重复渲染 |
| hand-page.tsx | 🟡 5/10 | 核心功能可用，保存逻辑重复 |
| quick-entry-wizard | 🔴 3/10 | 静默失败、缺积分输入、cardName 重复 |
| coach 模块 | 🔴 1/10 | 3 层全不可用 |
| 小程序整体 | 🔴 2/10 | 30% 功能完成度 |
| import-export | 🔴 2/10 | 数据完整性破坏 |
| globe.css | 🟢 7/10 | 设计精良，部分动画未用 |

---

## 五、修复路线图建议

### Sprint 3 (紧急修复 — 2 周)

1. **修复 import-export 数据丢失** (IX-51/52/53)
2. **修复 getHands 空返回 bug** (OP-12)
3. **QuickEntryWizard 加验证反馈** (OP-01, IX-01)
4. **教练模块决策**：删除 or 接入 poker-engine
5. **小程序决策**：补齐 or 隐藏桩页面

### Sprint 4 (架构清理 — 3 周)

1. **统一双轨类型**：迁移 14 处 `data.ts` 依赖到 `types.ts`
2. **统一牌面渲染**：全项目使用 SVG PokerCard 或 Tailwind CardDisplay
3. **合并清分雷达**：删除 Excel 方案，统一用 DB
4. **清理死代码**：删除 6+ 个零使用组件
5. **统一 `parseCardCode`**：删除 3 个本地副本

### Sprint 5 (质量提升 — 2 周)

1. **添加核心逻辑单元测试**（stats, clear-radar, session-service）
2. **无障碍补全**：CardSelector aria-label + 键盘导航
3. **安全加固**：API Key 不持久化、seed 加认证
4. **硬编码清理**：Windows 路径 → env var、种子数据匿名化

---

## 六、最终统计

```
总审计轮次: 15
总发现问题: 146 (136 独立 + 10 系统模式)
高优先级:    53 → 需在 Sprint 3-4 修复
中优先级:    54 → 需在 Sprint 5 修复  
低优先级:    29 → 可延后

跨轮次模式:  4 大类 (双轨、空壳、静默、硬编码)
```

*报告生成于 2026-06-24 · 15 轮递进式审计*
