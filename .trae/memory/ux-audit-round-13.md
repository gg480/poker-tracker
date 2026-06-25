# UX/交互审计 · 第 13 轮

**日期**: 2026-06-24
**范围**: 文档体系、.agents Skills、LLM 集成方案、数据流完整性
**方法**: 代码静态分析 + 文档评估 + 资源利用率统计

---

## 一、不便于操作（2 项）

### 🟡 [OP-41] `llm-integration-plan.md` 是 134 行详细集成方案，但 0% 已实现
- **文件**: `docs/llm-integration-plan.md`
- **问题**: 文档描述了从外部 LLM-Router 项目移植本书记员、智能路由、Prompt 缓存、SOP 引擎等 4 个 Phase 的详细计划。但**没有任何一行代码被执行**。所有"参考 llm X 模块"的设计都是蓝图——对于新开发者，这会误导他们对项目能力范围的认知。
- **修复**: 如果短期内不会实施，在文档顶部添加 "⚠️ 规划文档，尚未实施" 水印并标注预计启动日期。

### 🟢 [OP-42] `.agents/skills/` 有 14 个设计类 Skill，与扑克项目功能无关
- **文件**: `.agents/skills/` (14 个 Markdown 文件)
- **问题**: 以下 Skill 全部是 UI/品牌/设计相关的：
  - `brandkit`, `industrial-brutalist-ui`, `minimalist-ui`, `high-end-visual-design`
  - `stitch-design-taste`, `design-taste-frontend*`, `gpt-taste`
  - `image-to-code`, `imagegen-frontend-web`, `imagegen-frontend-mobile`
  - `redesign-existing-projects`, `full-output-enforcement`
  
  这些 Skill 在 `AGENTS.md` 中**没有任何引用或说明**。它们是全局 Agent 能力，但扑克项目的核心需求是数据处理、统计计算、场次管理——与 UI 设计关系不大。这些 Skill 占用了模型上下文空间但对项目任务无帮助。
- **修复**: 评估哪些 Skill 确实需要，清理不需要的以缩小 Skill listing 占用。

---

## 二、交互逻辑弱（1 项）

### 🟡 [IX-54] poker-weapp 7 个服务文件全部定义了完整的云函数 API，但 6 个对应页面是桩
- **文件**: 7 个 `services/*.ts` vs 对应的 UI 页面
- **问题**: 
  ```
  sessionService.ts → ✅ UI 已实现（录入页使用）
  recordService.ts  → ✅ UI 已实现
  playerService.ts  → ❌ 无对应 UI
  statsService.ts   → ❌ 排行榜页是桩
  seasonService.ts  → ❌ 赛季/我的页是桩
  clearService.ts   → ❌ 清分页是桩
  awardService.ts   → ❌ 奖项页是桩
  ```
  7 个服务文件中仅 2 个（29%）真正被 UI 调用。其余 5 个服务 → UI 的链路未完成。与 [[UX-Audit-Round-7]] 的 FE-27 形成呼应——小程序是"服务层已完成，UI 层未动工"的典型案例。
- **修复**: 优先级矩阵——按用户使用频率排序实现。

---

## 三、功能延申不合理（1 项）

### 🟡 [FE-46] `skills-lock.json` 文件用途不明
- **文件**: `skills-lock.json` (根目录)
- **问题**: 文件存在于根目录但未被任何 `package.json` script 或 CI 流程引用。内容不明（未读取）。可能是某个 Skill 体系的锁文件，但如果无自动化流程使用，它是多余的。
- **修复**: 确认用途——如果是依赖管理，添加对应的安装/更新脚本；如果废弃，删除。

---

## 总结

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| 不便于操作 | 0 | 1 | 1 | 2 |
| 交互逻辑弱 | 0 | 1 | 0 | 1 |
| 功能延申不合理 | 0 | 1 | 0 | 1 |
| **合计** | **0** | **3** | **1** | **4** |

### 📈 累计进度

| 轮次 | 新 | 累计 | 🔴 |
|------|-----|------|-----|
| 1-13 | 4 | **142** | **53** |
