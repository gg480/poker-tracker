# 德扑积分榜 (Poker Tracker)

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **图表**: Recharts
- **AI**: coze-coding-dev-sdk (LLM Skill, 流式 SSE)

## 项目概述

朋友局德州扑克积分追踪与分析工具，包含四个核心模块：

1. **总览** - 龙虎榜、累计积分走势曲线、胜率排行、单日最高记录、最近场次明细表
2. **录入** - 日期选择、玩家积分填写、自动校验合计为零、历史玩家联想、localStorage 持久化
3. **玩家** - 个人数据面板(总分/胜率/场均/极值)、个人走势图、逐场记录
4. **AI分析** - 接入 LLM API，5 个预设场景 + 自定义提问，流式 SSE 输出

## 目录结构

```
├── public/                     # 静态资源
├── scripts/                    # 构建与启动脚本
├── src/
│   ├── app/
│   │   ├── api/ai-analysis/    # AI 分析 SSE 接口
│   │   │   └── route.ts
│   │   ├── globals.css         # 全局样式 (深色主题)
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 主页面 (Tab 切换)
│   ├── components/
│   │   ├── poker/              # 业务组件
│   │   │   ├── dashboard.tsx   # 总览面板
│   │   │   ├── record-entry.tsx # 录入面板
│   │   │   ├── player-view.tsx  # 玩家详情面板
│   │   │   └── ai-analysis.tsx  # AI 分析面板
│   │   └── ui/                 # Shadcn UI 组件库
│   ├── hooks/                  # 自定义 Hooks
│   ├── lib/
│   │   ├── data.ts             # 类型定义、种子数据、localStorage 工具
│   │   ├── stats.ts            # 统计计算 (computeStats, useStats)
│   │   └── utils.ts            # 通用工具函数
│   └── server.ts               # 自定义服务端入口
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 构建与测试命令

- **开发**: `pnpm dev` (端口 5000)
- **构建**: `pnpm build`
- **类型检查**: `pnpm ts-check`
- **代码检查**: `pnpm lint`
- **启动生产**: `pnpm start`

## 核心数据流

- 数据存储在 `localStorage`，键名 `poker-tracker-records`
- 初始加载若无数据，自动写入种子数据 (`SEED_RECORDS`)
- `computeStats()` 接受 `PokerRecord[]` 返回 `ComputedStats`，由 `useStats` hook 在客户端 memo 化
- AI 分析通过 `POST /api/ai-analysis` 发送 `{ prompt, context }`，返回 SSE 流

## 开发规范

### Hydration 问题防范

1. 所有页面组件均标记 `"use client"`，数据通过 `useEffect` + `useState` 在客户端加载
2. 禁止在 JSX 渲染逻辑中直接使用 `typeof window`、`Date.now()` 等动态数据
3. 三方字体通过 `globals.css` 的 `@import` 引入（在 `@import 'tailwindcss'` 之前）

### 深色主题

项目使用自定义深色主题，所有 CSS 变量在 `globals.css` 的 `:root` 中定义（`--background: #0a0e1a` 等）。组件使用 Tailwind 类名引用主题色，避免硬编码颜色值。

### 包管理

**仅允许使用 pnpm**，严禁 npm 或 yarn。
