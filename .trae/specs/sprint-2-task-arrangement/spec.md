# Sprint 2 · 任务安排 Spec

## Why

当前项目已完成 Phase 0-2 所有核心功能开发，SOP 文档体系已建立。剩余的未完成任务（腾讯文档集成、组件重构、测试覆盖、性能优化）需要按优先级和依赖关系安排为 Sprint 2 的可执行任务，推进项目走向 v1.0 正式发布。

---

## What Changes

- 更新 `current-sprint.md` — 将 Sprint 2 规划写入冲刺文档
- 更新 `tasks.md` — 添加 Sprint 2 的原子任务清单
- 更新 `tech-debt.md` — 将已清理/待清理债务项状态刷新
- 创建 `.trae/specs/sprint-2-task-arrangement/` 下的 Spec 文档

---

## Impact

- Affected specs: 项目管理、任务跟踪
- Affected code: 无（纯文档编排）
- Dependencies: 本 Spec 不产生代码变更，仅规划任务

---

## 任务范围

### H1 — 必须完成

| ID | 任务 | 类型 | 目标 |
|----|------|------|------|
| T-101 | 腾讯文档集成完善 | 功能 | 实现 CSV 导入导出，连接器完成闭环 |
| T-102 | page.tsx 组件拆分 | 重构 | 首页组件拆分为 3 个子组件，行数 < 150 |
| T-103 | ESLint 合规修复 | 代码质量 | 修复所有 ESLint 警告/错误 |

### H2 — 建议完成

| ID | 任务 | 类型 | 目标 |
|----|------|------|------|
| T-201 | 单元测试覆盖扩展 | 测试 | 关键 Service 测试覆盖率 > 50% |
| T-202 | 完整功能测试 | 测试 | Phase 1+2 回归测试 |
| T-203 | 轻量错误追踪 | 工程 | 添加全局错误边界 + 错误日志 |

### H3 — 视情况完成

| ID | 任务 | 类型 | 目标 |
|----|------|------|------|
| T-301 | 性能监控 | 工程 | Web Vitals 采集 + 展示 |
| T-302 | 手牌分析增强 | 功能 | QuickEntry 补全流程 UI 完善 |

---

## Requirements

### Requirement: 腾讯文档集成
The system SHALL support CSV data import and export through Tencent Docs integration.

#### Scenario: CSV Import
- **WHEN** user uploads a CSV file
- **THEN** system parses and imports poker records into the database

#### Scenario: CSV Export
- **WHEN** user clicks export button
- **THEN** system generates and downloads a CSV file with all data

### Requirement: Component Refactoring
The system SHALL maintain component file size under 150 lines.

#### Scenario: page.tsx refactor
- **WHEN** page.tsx exceeds 150 lines
- **THEN** extract sub-components into separate files

### Requirement: Error Tracking
The system SHALL provide basic error boundary and logging.

#### Scenario: Runtime error
- **WHEN** an unhandled error occurs in a component
- **THEN** error boundary catches it and shows fallback UI
- **AND** error details are logged to console
