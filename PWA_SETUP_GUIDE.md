# PWA 配置指南 - 萌宠对对碰

## 📋 完成的工作清单

### 1. SVG Logo
- **文件**: `logo.svg`
- **说明**: 创建了高质量的SVG logo，包含彩色方块和网格背景，代表游戏主题
- **特点**: 渐变填充、光晕效果、可无限缩放

### 2. Favicon 生成
- **生成工具**: `pwa-asset-generator` + `sharp`
- **生成的文件**:
  - `public/favicon-16.png` - 16x16 尺寸
  - `public/favicon-32.png` - 32x32 尺寸
  - `public/favicon-64.png` - 64x64 尺寸
  - `public/favicon-128.png` - 128x128 尺寸
  - `public/favicon.ico` - ICO 格式（浏览器标签栏）

### 3. PWA Icon 和启动画面
- **工具**: `pwa-asset-generator` (NPM库)
- **生成的文件**:
  - `public/apple-icon-180.png` - iOS 主屏幕图标
  - `public/manifest-icon-192.maskable.png` - Android 192x192 icon
  - `public/manifest-icon-512.maskable.png` - Android 512x512 icon（高分辨率）
  - `public/apple-splash-*.png` - 多个iOS启动画面（支持所有iPhone和iPad尺寸）

**支持的iOS设备**:
  - iPad (1024x1366, 2x)
  - iPad Air/Pro (834x1194, 820x1180, 834x1112, 2x)
  - iPad (768x1024, 2x)
  - iPhone 15 Pro Max (1320x2868, 3x)
  - iPhone 15 Plus (1242x2688, 3x)
  - iPhone 15 (1170x2532, 3x)
  - iPhone 14 Pro Max (1284x2778, 3x)
  - 以及多个旧款iPhone尺寸

### 4. PWA 配置文件
- **文件**: `manifest.json`
- **内容**:
  ```json
  {
    "name": "萌宠对对碰",
    "short_name": "对对碰",
    "description": "一款可爱的动物主题消除游戏...",
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait-primary",
    "theme_color": "#6366f1",
    "icons": [...]
  }
  ```

### 5. Service Worker
- **文件**: `public/sw.js`
- **功能**:
  - 离线缓存支持
  - 资源预缓存
  - 网络请求拦截
  - 自动更新管理

### 6. HTML 配置
- **文件**: `index.html`
- **添加的meta标签**:
  - `manifest` 链接
  - `theme-color` 主题颜色
  - `apple-mobile-web-app-capable` iOS PWA支持
  - `apple-mobile-web-app-status-bar-style` iOS状态栏样式
  - `apple-mobile-web-app-title` iOS应用名称
  - 多个 `apple-touch-startup-image` iOS启动画面

### 7. Service Worker 注册
- **文件**: `index.tsx`
- **功能**: 在应用启动时注册Service Worker
- **代码**:
  ```typescript
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/public/sw.js').catch(error => {
      console.log('Service Worker registration failed:', error);
    });
  }
  ```

## 🚀 使用说明

### 生成Favicon
如果需要重新生成favicon（修改了logo.svg后）：
```bash
npm run generate-favicon
```

### 本地测试 PWA
```bash
npm run build
npm run preview
```

然后在浏览器地址栏中，您应该会看到一个"安装"按钮（Chrome/Edge），或者：
- **iOS**: 点击分享 > 添加到主屏幕
- **Android**: 点击菜单 > 安装应用

### 部署注意事项

1. **HTTPS 必需**: PWA 需要在 HTTPS 环境下运行（localhost 除外）
2. **Manifest 位置**: 确保 `manifest.json` 在根目录
3. **Service Worker**: 必须通过 HTTPS 或 localhost 访问
4. **Cache-Control**: 为生产环境设置适当的缓存策略

## 📦 相关依赖

```json
{
  "devDependencies": {
    "pwa-asset-generator": "^6.x", // PWA icon 和启动画面生成
    "sharp": "^0.33.x"             // 图像处理
  }
}
```

## 🎨 自定义 Logo

要修改logo，编辑 `logo.svg` 文件，然后：
1. 运行 `npm run generate-favicon` 重新生成favicon
2. 重新运行 `npx pwa-asset-generator logo.svg ./public --type png --manifest manifest.json` 生成icon和启动画面

## 📱 iOS PWA 安装步骤

1. 在 Safari 中打开应用
2. 点击共享按钮
3. 选择"添加到主屏幕"
4. 输入应用名称（或使用默认）
5. 点击添加

首次打开时会显示自定义启动画面（apple-splash-*.png）

## 📂 文件结构

```
match-3/
├── logo.svg                    # SVG logo源文件
├── manifest.json              # PWA配置清单
├── generate-favicon.js        # Favicon生成脚本
├── index.html                 # 包含PWA meta标签
├── index.tsx                  # Service Worker注册
├── vite.config.ts            # Vite配置（publicDir设置）
└── public/
    ├── sw.js                 # Service Worker
    ├── favicon-*.png         # Favicon文件
    ├── apple-icon-180.png    # iOS主屏图标
    ├── manifest-icon-*.png   # Android icon
    └── apple-splash-*.png    # iOS启动画面（多个文件）
```

## ✅ 检查清单

- [x] SVG logo 创建
- [x] Favicon 生成（16, 32, 64, 128, .ico）
- [x] PWA icon 生成（192x192, 512x512）
- [x] iOS 启动画面生成（支持所有尺寸）
- [x] manifest.json 配置
- [x] Service Worker 实现
- [x] HTML PWA meta标签配置
- [x] Service Worker 注册代码
- [x] Vite 配置优化

## 🔗 参考资源

- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Apple PWA Support](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

---

现在您的PWA应用已准备好部署！🎉
