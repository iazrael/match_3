<div align="center">
<h1>🎮 萌宠对对碰 (Match-3 Game)</h1>
<p>一款可爱的动物主题消除游戏，支持手机手势操作，带有音效和连击系统</p>
<p>
  <img alt="React" src="https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6.2-646cff?style=flat-square&logo=vite" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-Ready-success?style=flat-square" />
</p>
</div>

## ✨ 特性

- 🎮 **经典消除机制** - 三消游戏玩法
- 🎨 **可爱的视觉设计** - 彩色方块和动画效果
- 🔊 **音效系统** - 消除时的反馈音效
- 📱 **响应式设计** - 完美支持移动设备
- 👆 **手势操作** - 直观的触摸控制
- 🔗 **连击系统** - 连续消除的分数奖励
- 📱 **PWA 应用** - 可安装到主屏幕，支持离线运行
- 🍎 **iOS 优化** - 自定义启动画面和图标
- 🤖 **Android 优化** - Maskable icon 支持

## 🚀 快速开始

### 前置条件

- Node.js 16+ 和 npm/yarn

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器访问 http://localhost:3000
```

### 生产构建

```bash
# 构建应用
npm run build

# 本地预览构建结果
npm run preview
```

## 📁 项目结构

```
match-3/
├── components/           # React 组件
│   └── Tile.tsx         # 游戏瓦片组件
├── services/            # 业务逻辑
│   └── audioService.ts  # 音效服务
├── utils/               # 工具函数
│   └── gameLogic.ts     # 游戏逻辑
├── types.ts             # TypeScript 类型定义
├── App.tsx              # 主应用组件
├── index.tsx            # 应用入口（含 Service Worker 注册）
├── index.html           # HTML 模板（含 PWA 配置）
├── manifest.json        # PWA Web App Manifest
├── logo.svg             # SVG logo
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
└── public/              # 静态资源
    ├── sw.js            # Service Worker（离线支持）
    ├── favicon-*.png    # Favicon（多尺寸）
    ├── apple-icon-*.png # iOS 图标
    ├── manifest-icon-*.png  # Android 图标
    └── apple-splash-*.png   # iOS 启动画面（32 个）
```

## 📖 文档

- **[PWA_SETUP_GUIDE.md](./PWA_SETUP_GUIDE.md)** - 详细的 PWA 配置指南
- **[PWA_QUICK_REFERENCE.md](./PWA_QUICK_REFERENCE.md)** - PWA 快速参考

## 📱 PWA 安装

### iOS (Safari)

1. 在 Safari 中打开应用
2. 点击分享按钮 (⬆️)
3. 选择 "添加到主屏幕"
4. 输入应用名称并点击添加
5. 首次打开时会显示自定义启动画面

### Android (Chrome)

1. 在 Chrome 中打开应用
2. 点击菜单 (⋮)
3. 选择 "安装应用" 或点击地址栏的安装按钮
4. 确认安装

### 桌面 (Chrome/Edge)

1. 打开应用后，地址栏会显示安装按钮
2. 或点击菜单 (⋮) 选择 "安装应用"

## 🎨 自定义 Logo

编辑 `logo.svg` 文件后，运行以下命令重新生成所有相关资源：

```bash
# 重新生成 Favicon
npm run generate-favicon

# 重新生成 PWA 图标和启动画面
npx pwa-asset-generator logo.svg ./public --type png --manifest manifest.json
```

## 🛠️ NPM 脚本

| 命令 | 说明 |
|-----|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建结果 |
| `npm run generate-favicon` | 重新生成 Favicon |

## 📦 依赖项

### 生产依赖
- **react** (19.2) - UI 框架
- **react-dom** (19.2) - React DOM 绑定
- **lucide-react** (0.554) - 图标库

### 开发依赖
- **vite** (6.2) - 构建工具
- **@vitejs/plugin-react** (5.0) - React 支持
- **typescript** (5.8) - 类型检查
- **pwa-asset-generator** (6.x) - PWA 资源生成
- **sharp** (0.33) - 图像处理

## 🎮 游戏玩法

1. **目标** - 消除屏幕上相同颜色的方块
2. **操作** - 点击或拖动相邻的方块进行交换
3. **消除** - 连续三个或以上相同颜色的方块会被消除
4. **连击** - 连续消除可获得额外分数奖励
5. **音效** - 消除时会有反馈音效

## ⚙️ 技术栈

- **前端框架** - React 19 + TypeScript
- **构建工具** - Vite
- **样式** - Tailwind CSS
- **PWA** - Service Worker + Web App Manifest
- **图像** - SVG + PNG
- **兼容性** - 支持所有现代浏览器

## 🌐 浏览器支持

- ✅ Chrome/Edge (最新版)
- ✅ Firefox (最新版)
- ✅ Safari (14+)
- ✅ iOS Safari (14+)
- ✅ Android Chrome (最新版)

## 📊 构建信息

- 主应用大小: ~210 KB (gzip: ~66 KB)
- Service Worker: ~1.5 KB
- 全部资源: ~15.3 MB (包含启动画面)
- 离线支持: ✅ 已启用

## 🤝 开发

### 代码风格
- TypeScript 严格模式
- React Hooks 函数式组件
- Tailwind CSS 原子化设计

### 热更新
- 开发模式支持 HMR (Hot Module Replacement)
- 修改文件后自动刷新

## 📝 许可证

MIT

---

<div align="center">
  <p>🎉 准备好了？立即开始游戏或安装到你的设备吧！</p>
</div>