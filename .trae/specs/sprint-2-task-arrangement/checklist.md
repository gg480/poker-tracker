# Sprint 2 · 验证检查清单

**冲刺 ID**: sprint-2-task-arrangement
**说明**: 所有 H1 检查点必须通过才算冲刺交付完成。

---

## H1 · 硬目标检查

### T-101 腾讯文档集成

- [ ] CSV 导入功能可用：上传 CSV 后数据正确写入数据库
- [ ] CSV 导出功能可用：点击导出后下载 CSV 文件
- [ ] UI 面板完整：上传区域、导出按钮、导入预览均正常渲染
- [ ] 错误处理完善：非法文件格式/空内容有错误提示

### T-102 page.tsx 拆分

- [ ] `DashboardStats` 组件已提取并正常渲染
- [ ] `QuickActions` 组件已提取并正常渲染
- [ ] `HomeTabContent` 组件已提取并正常渲染
- [ ] `page.tsx` 行数 < 150 行（原约 300 行）
- [ ] 拆分后页面功能不变（首页 Tab 切换正常）

### T-103 ESLint 合规

- [ ] `pnpm lint` 执行无错误
- [ ] `pnpm lint` 执行无警告
- [ ] 所有已识别的 lint 问题已修复或记录到 tech-debt.md

---

## H2 · 弹性目标检查

### T-201 单元测试

- [ ] `stats-service.test.ts` 测试文件存在且包含 > 3 个测试用例
- [ ] `data.test.ts` 已有测试扩展至 > 15 个用例
- [ ] `pnpm test` 全部测试通过

### T-202 功能测试

- [ ] 开发服务器 `pnpm dev` 正常启动
- [ ] 首页、录入、排行、手牌、设置五个 Tab 页面正常渲染
- [ ] 场次创建-录入-确认流程完整可用

### T-203 错误追踪

- [ ] `ErrorBoundary` 组件存在
- [ ] `layout.tsx` 已包裹 ErrorBoundary
- [ ] 错误发生时显示 fallback UI

---

## H3 · 延伸目标检查

### T-301 性能监控

- [ ] `web-vitals` 依赖已安装
- [ ] 开发环境下可看到 Web Vitals 输出

### T-302 手牌分析增强

- [ ] 快速录入记录可点击"补全"进入完整向导
- [ ] 完整向导可加载快速录入的初始手牌数据
- [ ] 补全后 `isComplete` 更新为 `true`
