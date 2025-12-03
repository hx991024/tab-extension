# 项目设计规范文档

## 阶段 1：产品功能设计文档

### 1.1 产品定位

一款极简、高性能、高颜值的通用 Chrome / Edge 新标签页扩展（New Tab Extension）。旨在完全替换浏览器默认的新标签页，提供无干扰、美观且实用的起始页体验。

### 1.2 核心功能模块

#### A. 主界面 (New Tab)

- **中央信息区**：
  - 实时显示当前时间 (HH:mm:ss)。
  - 显示当前日期 (YYYY 年 MM 月 DD 日 星期 X)。
- **顶部搜索区**：
  - 搜索输入框（支持宽度调节）。
  - 左侧显示当前搜索引擎图标。
  - 支持 Enter 键执行搜索。
- **背景系统**：
  - 仅支持本地上传图片 (jpg/png/webp)。
  - 支持遮罩层（颜色、透明度）以增强文字可读性。
  - 支持背景模糊效果。

#### B. 设置系统 (Settings Drawer)

- **入口**：左下角固定齿轮图标，点击滑出左侧抽屉 (320px)。
- **四大设置模块**：
  1.  **常规设置**：
      - 搜索框样式调节（宽度 400px-900px，透明度 0.2-1.0）。
      - 搜索跳转方式（新标签页/当前标签页）。
      - Tab 键切换引擎开关。
  2.  **壁纸设置**：
      - 本地图片上传。
      - 遮罩透明度 (0.0-0.8)。
      - 模糊强度 (0-20px)。
  3.  **搜索引擎**：
      - 内置：Google, Bing, Baidu, DuckDuckGo。
      - 自定义：支持添加名称、URL、图标。
      - 支持设置默认引擎。
  4.  **主题切换**：
      - 跟随系统（自动）。
      - 浅色模式 (Light)。
      - 深色模式 (Dark)。

### 1.3 功能边界 (Constraints)

- **不开发**：账号系统、搜索历史、搜索建议、通知、主题商城、网络壁纸、每日自动壁纸。
- **数据存储**：所有配置本地持久化，无云端同步。

---

## 阶段 2：技术架构说明

### 2.1 技术栈

- **核心规范**：Manifest V3 (Chrome & Edge)。
- **编程语言**：原生 HTML5, CSS3, JavaScript (ES6+)。
- **框架限制**：**严禁**使用 React, Vue, Svelte, jQuery 等任何第三方框架。
- **样式处理**：原生 CSS Variables (用于主题切换), CSS Transitions (用于动画), Flexbox/Grid 布局。

### 2.2 核心架构决策

1.  **数据持久化**：

    - 使用 `chrome.storage.local` API。
    - 封装 `StorageManager` 类，统一处理读写操作，实现配置的自动保存与加载。
    - 数据结构设计为扁平化 JSON 对象，例如 `{ settings: {...}, wallpapers: {...}, engines: [...] }`。

2.  **性能优化**：

    - **渲染优化**：时间更新使用 `requestAnimationFrame` 或精准 `setInterval` (1s)。
    - **资源加载**：壁纸数据（Base64）若过大，考虑使用 IndexedDB 或限制上传大小（虽提示词要求 `storage.local`，但需注意配额，本项目优先遵循提示词使用 `storage.local`，若遇性能瓶颈再做调整）。
    - **防抖/节流**：设置面板的滑块操作（如模糊度、透明度）需应用节流，避免频繁重绘。

3.  **UI/UX 架构**：
    - **Glassmorphism**：使用 `backdrop-filter: blur()` 实现毛玻璃效果。
    - **主题系统**：基于 CSS Variables (`:root`, `[data-theme="dark"]`) 实现一键切换。
    - **组件化**：虽然不使用框架，但 JS 代码需采用模块化设计 (ES Modules)，每个功能块独立封装。

---

## 阶段 3：目录结构 & 模块划分

### 3.1 目录结构树

```text
/tab-extension
├── manifest.json                # 扩展核心配置文件 (MV3)
├── newtab.html                  # 新标签页入口文件
├── styles/                      # 样式文件夹
│   ├── main.css                 # 全局重置与基础布局
│   ├── theme.css                # 主题变量定义 (Light/Dark)
│   ├── settings.css             # 设置抽屉与控件样式
│   ├── wallpaper.css            # 壁纸与背景层样式
│   └── components.css           # 搜索框、时钟等组件样式
├── scripts/                     # 逻辑文件夹
│   ├── main.js                  # 入口脚本，负责初始化与模块协调
│   ├── clock.js                 # 时间日期模块
│   ├── search.js                # 搜索功能与跳转逻辑
│   ├── settings.js              # 设置面板 UI 交互与事件绑定
│   ├── theme.js                 # 主题切换逻辑
│   ├── wallpaper.js             # 壁纸上传、渲染与样式应用
│   ├── engines.js               # 搜索引擎管理逻辑
│   └── storage.js               # 数据存储封装层
├── assets/                      # 静态资源
│   ├── icons/                   # 扩展图标 (16, 48, 128)
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── ui/                      # UI 图标 (SVG)
│       ├── gear.svg             # 设置图标
│       ├── search.svg           # 搜索图标
│       └── ...
└── background.js                # 后台服务 (按需，MV3 Service Worker)
```

### 3.2 模块职责说明

1.  **`manifest.json`**: 定义扩展名称、版本、权限 (`storage`, `chrome_url_overrides`)、CSP 等。
2.  **`newtab.html`**: 极其精简的 DOM 结构，主要包含背景层、内容容器（时钟、搜索）、设置抽屉容器。
3.  **`storage.js`**: 核心数据层。提供 `save(key, value)`, `get(key)`, `getAll()` 等方法，屏蔽 `chrome.storage` 的异步复杂性（通过 Promise/Async Await）。
4.  **`main.js`**: 引导程序。页面加载时依次调用 `Storage.init()`, `Theme.init()`, `Wallpaper.init()`, `Clock.init()` 等。
5.  **`settings.js`**: 负责生成设置面板的 HTML 结构（如果动态生成）或绑定静态 HTML 的事件。监听滑块、开关变动，实时调用其他模块的更新方法并触发保存。
6.  **`wallpaper.js`**: 处理文件上传 (`FileReader` 转 Base64)，将图片应用到背景，并根据设置调整 CSS 滤镜。
7.  **`theme.js`**: 监听系统主题变化 (`matchMedia`)，切换 `<html>` 标签的 `data-theme` 属性。
