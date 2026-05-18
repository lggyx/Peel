# Peel

> 智能视频分析应用 —— AI 驱动的视频内容结构化理解与交互式问答

**包名：** `com.lggyx` ｜ **版本：** 1.0.0 ｜ **最后更新：** 2026-05-10

---

## 1. 项目概述

Peel（曾用名 ReelMind）是一款面向移动端（优先 Android）的智能视频分析应用。用户导入视频后，后端通过 AI（StepFun step-3.6）进行多维度结构化分析，生成角色、剧情、时间线、人物关系、故事发展线和视觉主题；前端基于分析结果提供 AI 问答和故事线浏览功能，且 AI 面板和故事线区域会根据视频内容动态变换配色主题。

**核心特性：**
- AI 驱动的视频结构化分析（角色 / 剧情 / 时间线 / 关系 / 故事线 / 主题）
- 基于分析内容的 AI 问答（上下文增强的 RAG 模式）
- 纯文本结构化故事线展示
- AI 生成动态 CSS 主题（仅作用于 AI 面板 + 故事线区域）
- 内置演示视频（离线资源，零网络依赖）
- 横屏沉浸式播放 + 竖屏列表浏览

---

## 2. 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React | 18.2.x | UI 组件化 |
| 语言 | TypeScript | 5.3.x | 类型安全 |
| 构建工具 | Vite | 5.1.x | 开发服务器 + 打包 |
| 样式 | TailwindCSS | 3.4.x | 原子化 CSS |
| 路由 | react-router-dom | 6.22.x | 页面导航 |
| 移动端桥接 | Capacitor | 8.0.x | Web → Native（Android） |
| 本地数据库 | @capacitor-community/sqlite | 8.0.x | SQLite 本地存储 |
| 方向控制 | @capacitor/screen-orientation | 8.0.x | 横竖屏锁定 |
| 状态栏 | @capacitor/status-bar | 8.0.2 | 状态栏显隐控制 |
| 后端代理 | Express | — | API 代理 + 密钥保护 |
| AI 服务 | StepFun API | step-3.6 | 视频分析与对话 |

---

## 3. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                       Android 设备                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Capacitor WebView                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐ │  │
│  │  │  Library    │  │   Player    │  │  Storyline    │ │  │
│  │  │  竖屏列表   │  │  横屏播放   │  │   Panel       │ │  │
│  │  └─────────────┘  └─────────────┘  └───────────────┘ │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐ │  │
│  │  │ useVideo    │  │   AI Chat   │  │   SQLite      │ │  │
│  │  │ Theme Hook  │  │   问答面板  │  │  (local DB)   │ │  │
│  │  └─────────────┘  └─────────────┘  └───────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           MainActivity (WebView 配置优化)              │  │
│  │  - 自动播放视频 (setMediaPlaybackRequiresUserGesture)  │  │
│  │  - 允许混合内容 (MixedContentMode)                     │  │
│  │  - 允许 file:// 访问                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS / LAN
┌─────────────────────────────────────────────────────────────┐
│                      reelmind-proxy                          │
│  Express 代理服务器，运行在 0.0.0.0:3000                     │
│  - 接收前端 /analyze 和 /chat 请求                           │
│  - 注入 StepFun API Key，转发到 StepFun 服务器               │
│  - JSON 容错解析（直接 JSON / Markdown 代码块 / 正则提取）    │
│  - normalizeAnalysis 校验与填充默认值                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     StepFun API (step-3.6)                   │
│  - 视频分析：返回结构化 JSON（角色 / 剧情 / 时间线 /          │
│    关系 / 故事线 / 主题 CSS 变量）                           │
│  - AI 问答：基于分析上下文的多轮对话                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 数据模型

### 4.1 SQLite 表结构

**videos 表**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 视频唯一标识（UUID） |
| title | TEXT | | 视频标题 |
| url | TEXT | NOT NULL | 视频地址（相对路径 / 网络 URL / file://） |
| status | TEXT | DEFAULT 'pending' | `pending` / `analyzing` / `completed` / `error` |
| analysis_json | TEXT | | AI 分析结果 JSON 字符串 |
| created_at | INTEGER | DEFAULT strftime('%s','now') | 创建时间戳 |

**chat_messages 表**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增主键 |
| video_id | TEXT | NOT NULL | 关联视频 ID |
| role | TEXT | NOT NULL | `user` / `assistant` |
| content | TEXT | NOT NULL | 消息内容 |
| created_at | INTEGER | DEFAULT strftime('%s','now') | 创建时间戳 |

### 4.2 分析 JSON 结构（analysis_json）

```typescript
interface VideoAnalysis {
  characters: { name: string; description: string }[]
  plotSummary: string
  timeline: { time: string; event: string }[]
  relationships: { from: string; to: string; relation: string }[]
  storyline?: StorylineEntry[]
  theme?: ThemeVariables
}

interface StorylineEntry {
  phase: string      // 阶段标题，如"第一幕：盛世开篇"
  summary: string    // 阶段摘要
  highlights: string[] // 高光标签
  mood: string       // 情绪标签，如"庄严辉煌"
}

interface ThemeVariables {
  primary: string     // 主色调（按钮 / 用户气泡 / 标题）
  secondary: string   // 次背景色
  accent: string      // 强调色（图标 / 标签文字 / 装饰线）
  surface: string     // 卡片/面板背景
  text: string        // 主文字色
  textMuted: string   // 副文字色
  bubbleUser: string  // 用户消息气泡背景
  bubbleAi: string    // AI 消息气泡背景
  tagBg: string       // 标签背景
  tagText: string     // 标签文字
  mood: string        // 情绪描述文本
}
```

**兼容性：** 老数据缺少 `storyline` 或 `theme` 时，`parseAnalysis()` 会安全降级，返回默认主题和空故事线数组。

---

## 5. API 契约

### 5.1 前端 ↔ 代理后端

**POST /analyze**

请求体：
```json
{
  "videoUrl": "https://example.com/video.mp4"
}
```

响应体：
```json
{
  "analysis": {
    "characters": [...],
    "plotSummary": "...",
    "timeline": [...],
    "relationships": [...],
    "storyline": [...],
    "theme": { "primary": "#8B1A1A", ... }
  }
}
```

**POST /chat**

请求体：
```json
{
  "messages": [
    { "role": "system", "content": "上下文提示词..." },
    { "role": "user", "content": "用户问题" }
  ]
}
```

响应体：SSE 流（标准 OpenAI streaming 格式）

### 5.2 代理后端 ↔ StepFun API

代理将前端请求转换为 StepFun API 格式，注入 API Key，处理流式响应。分析 Prompt 要求 AI 返回严格 JSON，包含 `storyline`（3-5 个阶段）和 `theme`（11 个 CSS 变量）。

**JSON 容错机制：**
1. 直接 `JSON.parse()`
2. 提取 Markdown 代码块中的 JSON
3. 正则匹配首尾 `{}` 包裹的内容
4. `normalizeAnalysis()` 填充缺失字段和默认值

---

## 6. 核心功能模块

### 6.1 主题系统（useVideoTheme）

位置：`src/hooks/useVideoTheme.ts`

机制：
- 接收 `ThemeVariables` 对象
- 通过 `document.documentElement.style.setProperty` 注入 11 个 CSS 变量
- Unmount 时自动清理，恢复默认主题

注入的 CSS 变量：
```css
--theme-primary
--theme-secondary
--theme-accent
--theme-surface
--theme-text
--theme-text-muted
--theme-bubble-user
--theme-bubble-ai
--theme-tag-bg
--theme-tag-text
--theme-mood
```

### 6.2 故事线组件（StorylinePanel）

位置：`src/components/StorylinePanel.tsx`

- 接收 `StorylineEntry[]` 数组
- 每个阶段渲染为独立卡片，左侧带强调色竖线
- 卡片内包含：阶段标题、情绪标签、摘要、高亮标签列表
- 所有颜色通过 CSS 变量驱动，支持动态主题切换
- 空数据时显示占位提示

### 6.3 视频播放（Player 页面）

位置：`src/pages/Player.tsx`

**进入页面时：**
1. `ScreenOrientation.lock('landscape')` 锁定横屏
2. `StatusBar.hide()` 隐藏状态栏
3. 加载视频数据和历史聊天记录
4. 注入视频主题 CSS 变量

**视频播放增强：**
- `<source>` 子标签代替 `src` 属性
- `crossOrigin="anonymous"` 已移除（避免防盗链 CORS 拦截）
- `resolveVideoUrl()` 处理三种路径：
  - `./videos/xxx.mp4` → 直接使用（Capacitor 本地服务器映射）
  - `file://...` → `Capacitor.convertFileSrc()` 转换
  - 普通 URL → 原样使用
- 错误处理：MediaError 代码映射 + 错误覆盖层 + 重试按钮
- 加载中状态：旋转动画 + "视频加载中..."

**离开页面时：**
1. `ScreenOrientation.unlock()` 解除方向锁定
2. `StatusBar.show()` 恢复状态栏
3. 清理主题 CSS 变量

### 6.4 视频库（Library 页面）

位置：`src/pages/Library.tsx`

- 竖屏布局，`safe-top safe-bottom` 预留刘海和底部安全区
- 列表展示所有视频卡片，显示标题、状态、故事线数量、主题情绪
- 支持添加新视频 URL 并触发后端分析
- 支持删除视频
- 点击卡片进入 Player 页面

### 6.5 全局状态栏控制

位置：`src/App.tsx`

- 应用启动时全局调用 `StatusBar.hide()`
- 全应用（Library + Player）均无状态栏，沉浸式体验

---

## 7. Android 配置

### 7.1 AndroidManifest.xml

```xml
<application android:hardwareAccelerated="true">
  <activity android:hardwareAccelerated="true"
            android:configChanges="orientation|keyboardHidden|...">
```

- `hardwareAccelerated="true"`：WebView 视频硬解加速（应用级 + Activity 级双声明）
- `INTERNET` 权限已声明

### 7.2 MainActivity.java

```java
WebSettings settings = webView.getSettings();
settings.setMediaPlaybackRequiresUserGesture(false);     // 自动播放
settings.setMixedContentMode(MIXED_CONTENT_ALWAYS_ALLOW); // HTTP/HTTPS 混合
settings.setAllowFileAccess(true);                        // 文件访问
settings.setAllowUniversalAccessFromFileURLs(true);       // file:// → https://
```

### 7.3 本地资源路径

Capacitor `webDir: 'dist'` 运行时，`public/` 目录下的资源通过内置本地服务器映射：

```
public/videos/demo_video.mp4      →  https://localhost/videos/demo_video.mp4
public/videos/chen_she_shi_jia.mp4 → https://localhost/videos/chen_she_shi_jia.mp4
```

**禁止在 WebView 中使用 `file://` 路径**，必须通过 Capacitor 本地服务器或 `convertFileSrc()` 转换。

---

## 8. 演示数据

应用首次启动时自动插入两条演示视频（`seedDemoVideos()`）：

| 视频 | ID | 路径 | 主题风格 | 主色 |
|------|-----|------|---------|------|
| 乾隆盛世 | `demo-qianlong-shengshi` | `./videos/demo_video.mp4` | 宫廷奢华 | `#9E2A2B` 深红 + `#E6B800` 明金 |
| 陈涉世家 | `demo-chen-she-shi-jia` | `./videos/chen_she_shi_jia.mp4` | 草莽冷峻 | `#1A5F7A` 海蓝 + `#4CC9F0` 冰蓝 |

两条主题色相完全相反（暖红 vs 冷蓝），对比度极高，便于演示时一眼区分 AI 动态换肤效果。

---

## 9. 构建流程

### 9.1 环境要求

- Node.js ≥ 22
- Android Studio Otter 2025.2.1+（如需 Android）

### 9.2 目录结构

```
peel/
├── reelmind-app/           # 前端 + Capacitor 移动应用
│   ├── public/videos/      # 演示视频资源（打包进 APK）
│   ├── src/
│   │   ├── pages/          # Library.tsx, Player.tsx
│   │   ├── components/     # StorylinePanel.tsx
│   │   ├── hooks/          # useVideoTheme.ts
│   │   ├── types/          # analysis.ts
│   │   ├── config/         # API 配置
│   │   ├── db/             # init.ts（SQLite + 种子数据）
│   │   ├── utils/          # uuid.ts
│   │   └── App.tsx
│   ├── android/            # Capacitor Android 原生项目
│   ├── capacitor.config.ts # Capacitor 配置
│   └── package.json
├── reelmind-proxy/         # Express 代理后端
│   ├── index.js            # 代理服务器 + AI Prompt
│   ├── config.js           # 运行时配置
│   ├── analysis.js         # AI JSON 提取与标准化
│   └── package.json
└── docs/                   # 技术文档
    └── technical-spec.md   # 详细技术说明
```

### 9.3 启动步骤

**1. 启动代理后端**

```bash
cd reelmind-proxy
cp .env.example .env
# 编辑 .env，填入 STEPFUN_API_KEY；如需真机访问，设置 PUBLIC_BASE_URL 为局域网或公网代理地址
# MAX_DOWNLOAD_BYTES 默认 134217728，即 128MB
npm install
npm start
```

后端监听 `0.0.0.0:3000`。

**2. 浏览器测试**

```bash
cd reelmind-app
cp .env.example .env
# 编辑 .env，设置 VITE_API_BASE_URL，例如 http://localhost:3000 或 http://<电脑局域网IP>:3000
npm install
npm run dev
```

**3. Android 构建**

```bash
cd reelmind-app
npm run build          # Vite 打包到 dist/
npx cap sync android   # 同步到 android/ 项目
npm run android        # 打开 Android Studio
```

在 Android Studio 中点击 "Run" 安装 APK。

---

## 10. 安全与注意事项

- **API Key 保护**：StepFun API Key 仅存储在代理后端的 `.env` 中，前端只配置 `VITE_API_BASE_URL` 指向代理服务，不能把 StepFun Key 放进前端代码或 APK
- **视频路径安全**：禁止在 WebView 中直接使用 `file://` 路径，使用 Capacitor 本地服务器或 `convertFileSrc()`
- **CORS 与防盗链**：外部 CDN 视频可能被防盗链拦截，推荐使用本地资源或可控的 CDN
- **数据库清理**：修改演示数据后需卸载 App 或清除应用数据，让 SQLite 重新初始化

---

## 11. 后续扩展建议

- 接入视频文件选择器（`@capacitor/filesystem`），支持用户上传本地视频
- 增加分析结果导出功能（PDF / 图片长图）
- 多语言支持（i18n）
- iOS 平台适配
- 离线 AI 模型（端侧推理）降低网络依赖
