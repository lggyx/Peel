# ReelMind MVP（Capacitor 8 + SQLite + UUID 修复）

## 修复内容

- `crypto.randomUUID` → `generateUUID()` 兼容函数
- 后端绑定 `0.0.0.0` 支持局域网访问
- Android 跨域配置完整

## 环境要求

- Node.js ≥ 22
- Android Studio Otter 2025.2.1+（如需 Android）

## 快速开始

### 1. 启动代理后端

```bash
cd reelmind-proxy
cp .env.example .env
# 编辑 .env，填入 STEPFUN_API_KEY
npm install
npm start
```

后端监听 `0.0.0.0:3000`，局域网可访问。

### 2. 浏览器测试

```bash
cd reelmind-app
cp .env.example .env
npm install
npm run dev
```

### 3. Android 真机测试

#### 3.1 获取电脑局域网 IP

```bash
ipconfig  # Windows，找到 WiFi IPv4 地址
```

#### 3.2 修改前端 API 地址

编辑 `.env`：
```
VITE_API_BASE=http://192.168.1.xxx:3000
```

#### 3.3 构建

```bash
npm run build
npx cap sync android
```

#### 3.4 配置跨域

复制 `android/network_security_config.xml` 到：
```
android/app/src/main/res/xml/network_security_config.xml
```

修改 `android/app/src/main/AndroidManifest.xml`：
```xml
<application
    ...
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
```

#### 3.5 运行

```bash
npx cap open android
```

在 Android Studio 中点击 Run。

**确保手机和电脑在同一 WiFi。**

## 常见问题

### jeep-sqlite 错误

浏览器测试时出现：确保 `index.html` 中有 `<jeep-sqlite></jeep-sqlite>` 标签。

### crypto.randomUUID 错误

已修复：使用 `src/utils/uuid.ts` 中的 `generateUUID()` 函数。

### Android 跨域失败

- 检查 `network_security_config.xml` 位置
- 检查 `AndroidManifest.xml` 是否添加 `usesCleartextTraffic`
- 确保手机和电脑在同一网络
- 检查防火墙是否放行 3000 端口
