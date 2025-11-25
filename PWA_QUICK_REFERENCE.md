## 快速参考 - PWA 和 Logo 配置

### 📦 已安装的 NPM 库
```bash
pwa-asset-generator  # PWA icon 和启动画面生成
sharp               # 图像处理库
```

### 📂 生成的文件列表

#### 根目录文件
```
logo.svg                 # SVG logo（可编辑）
manifest.json           # PWA 清单配置
generate-favicon.js     # Favicon 生成脚本
PWA_SETUP_GUIDE.md      # 详细配置指南
```

#### Public 文件夹中的图像文件
```
Favicon 相关:
├── favicon-16.png          (693 B)
├── favicon-32.png          (1.6 K)
├── favicon-64.png          (3.1 K)
├── favicon-128.png         (6.5 K)
└── favicon.ico             (1.6 K)

iOS 相关:
├── apple-icon-180.png      (10 K)   - 主屏幕图标
└── apple-splash-*.png      (30+ 文件) - 启动画面

Android 相关:
├── manifest-icon-192.maskable.png   (12 K)
└── manifest-icon-512.maskable.png   (67 K)

Service Worker:
└── sw.js                   (1.5 K) - 离线缓存支持
```

### 🎯 核心配置文件修改

#### 1. index.html
- ✅ 添加了 `<link rel="manifest">` 
- ✅ 添加了 theme-color meta 标签
- ✅ 添加了 apple-mobile-web-app-* meta 标签
- ✅ 添加了 apple-touch-startup-image 链接
- ✅ 添加了 favicon 链接

#### 2. index.tsx
- ✅ 添加了 Service Worker 注册代码

#### 3. vite.config.ts
- ✅ 添加了 `publicDir: 'public'` 配置

#### 4. manifest.json
- ✅ 配置了应用名称、图标和启动行为

### 🚀 快速命令

```bash
# 重新生成 favicon（修改 logo.svg 后）
npm run generate-favicon

# 重新生成所有 PWA 资源
npx pwa-asset-generator logo.svg ./public --type png --manifest manifest.json

# 本地构建和测试
npm run build
npm run preview

# 开发模式
npm run dev
```

### ✨ 关键特性

- ✅ **离线支持**: Service Worker 缓存策略
- ✅ **iOS 优化**: 32 个启动画面覆盖所有 iPhone/iPad 尺寸
- ✅ **Android 优化**: Maskable icon 支持
- ✅ **Favicon**: 5 种尺寸（16, 32, 64, 128, .ico）
- ✅ **主题色**: #6366f1（紫蓝色）
- ✅ **Standalone 模式**: 全屏应用体验

### 📱 安装步骤

**iOS (Safari):**
1. 打开应用 → 分享 → 添加到主屏幕
2. 显示自定义启动画面和图标

**Android (Chrome):**
1. 打开应用 → 菜单 → 安装应用
2. 或显示"安装"按钮自动弹出

**桌面 (Chrome/Edge):**
1. 地址栏显示安装按钮
2. 或菜单 → 安装应用

### ⚠️ 重要提示

1. **HTTPS 必需**: 生产环境需要 HTTPS（localhost 除外）
2. **Cache 更新**: Service Worker 修改后需要清除旧缓存
3. **Manifest 位置**: 确保在根目录可访问
4. **Logo 修改**: 更新 `logo.svg` 后要重新生成所有资源

### 📊 构建输出大小

```
主应用:           210.74 KB (gzip: 66.19 KB)
Favicon:          ~15 KB (全部 favicon)
iOS 启动画面:     ~15 MB (所有 PNG)
Android icons:    ~79 KB
总计:             ~15.3 MB
```

### 🔗 相关文件快速查找

| 用途 | 文件路径 |
|-----|--------|
| Logo 编辑 | `./logo.svg` |
| PWA 配置 | `./manifest.json` |
| Service Worker | `./public/sw.js` |
| 离线缓存列表 | 在 `public/sw.js` 的 `urlsToCache` |
| HTML 配置 | `./index.html` <head> 部分 |
| SW 注册 | `./index.tsx` 底部 |

---

完成! 🎉 你的游戏现在已是完整的 PWA 应用！
