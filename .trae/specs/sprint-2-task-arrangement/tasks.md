# Sprint 2 · 任务清单

**冲刺周期**: 2 周（2026-05-05 ~ 2026-05-19）
**状态**: 已规划

> 说明：任务按 `H1(必须) → H2(建议) → H3(视情况)` 优先级排列。H1 为冲刺硬目标，H2/H3 视进度弹性执行。

---

## H1 · 硬目标（必须完成）

### T-101 腾讯文档集成完善

- [ ] Sub-Task 1: 完善 tencent-docs-service.ts — 实现 CSV 数据解析函数
  - [ ] 从 CSV 文本解析出字段映射到 PokerRecord
  - [ ] 支持中文列头识别（日期/玩家/积分）
- [ ] Sub-Task 2: 实现 CSV 导出函数
  - [ ] 从数据库导出数据生成 CSV 字符串
  - [ ] 提供下载 blob
- [ ] Sub-Task 3: 完善 tencent-docs-panel.tsx UI
  - [ ] 添加文件上传区域
  - [ ] 添加导出按钮
  - [ ] 添加导入结果预览和确认
- [ ] Sub-Task 4: API Routes 完善
  - [ ] `POST /api/tencent-docs` 处理导入请求
  - [ ] 数据校验和错误处理

### T-102 page.tsx 组件拆分

- [ ] Sub-Task 1: 提取 `DashboardStats` 组件 — 首页统计卡片区域
- [ ] Sub-Task 2: 提取 `QuickActions` 组件 — 快捷操作按钮组
- [ ] Sub-Task 3: 提取 `HomeTabContent` 组件 — 首页标签内容
- [ ] Sub-Task 4: 验证：page.tsx 主体行数 < 150 行

### T-103 ESLint 合规修复

- [ ] Sub-Task 1: 运行 `pnpm lint` 收集全部警告/错误
- [ ] Sub-Task 2: 逐一修复（按文件依次）
  - [ ] 无效 hook 调用顺序修复
  - [ ] 未使用变量/import 清理
  - [ ] 尾随逗号/格式对齐
- [ ] Sub-Task 3: 验证 `pnpm lint` 通过

---

## H2 · 弹性目标（建议完成）

### T-201 单元测试覆盖扩展

- [ ] Sub-Task 1: 为 stats-service.ts 编写单元测试
  - [ ] `computeStats` 函数测试
  - [ ] `computeAwards` 函数测试
  - [ ] 边界条件（空数据、单玩家）测试
- [ ] Sub-Task 2: 为 data.ts 的工具函数编写更多测试
  - [ ] `calcOverallBalance`
  - [ ] `getRecordsForSeason`
  - [ ] `getPostClearBalance`
- [ ] Sub-Task 3: 运行 `pnpm test` 全部通过

### T-202 完整功能测试

- [ ] Sub-Task 1: 确认开发服务器可正常启动
- [ ] Sub-Task 2: 手动验证核心流程
  - [ ] 首页加载显示赛季概览
  - [ ] 录入页面可创建场次和记录
  - [ ] 排行页面显示正确数据
  - [ ] 手牌录入-快速模式可用
  - [ ] 清分雷达显示预警
  - [ ] 设置页面可导入导出

### T-203 轻量错误追踪

- [ ] Sub-Task 1: 创建全局 ErrorBoundary 组件
- [ ] Sub-Task 2: 在 layout.tsx 中包裹 ErrorBoundary
- [ ] Sub-Task 3: 添加错误日志记录 util 函数

---

## H3 · 延伸目标（视情况完成）

### T-301 性能监控

- [ ] Sub-Task 1: 安装 `web-vitals` 库
- [ ] Sub-Task 2: 在 layout.tsx 中采集 Web Vitals
- [ ] Sub-Task 3: 开发环境下打印指标到控制台

### T-302 手牌分析增强

- [ ] Sub-Task 1: hand-page.tsx 补全按钮触发完整向导
- [ ] Sub-Task 2: 向导可接收快速录入的初始数据
- [ ] Sub-Task 3: 补全后自动更新 isComplete=true

---

## 任务依赖关系

- **T-103** 无依赖，可优先执行
- **T-102** 无依赖，可与 T-101 并行
- **T-101.3** 依赖 T-101.1 和 T-101.2
- **T-201** 无依赖，可与 H1 任务并行
- **T-202** 依赖 T-102、T-103 完成后验证
- **T-203** 无依赖，可独立进行
- **T-302** 依赖 T-102（因为涉及 page.tsx 重构后的手牌页面）
