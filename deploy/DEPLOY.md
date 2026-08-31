# Peel 部署指南

## 服务器要求

- 2 核 2G 云服务器（推荐 Ubuntu 22.04+）
- 域名已解析到服务器 IP（A 记录）
- Docker + Docker Compose 已安装
- 端口 80/443 未被占用

## 快速部署

```bash
# 1. 克隆仓库
git clone https://github.com/lggyx/Peel.git
cd Peel

# 2. 配置环境变量
cp deploy/.env.server.example deploy/.env.server
nano deploy/.env.server   # 填入实际值

# 3. 上传演示视频到 GitHub Release（首次部署）
# 见下方「演示视频分发」章节

# 4. 启动服务
docker compose -f deploy/docker-compose.yml up -d

# 5. 验证
curl https://peel.lggyx.com/health
```

## 演示视频分发

演示视频托管在 GitHub Release，应用首次启动时自动下载。

```bash
# 1. 打包演示视频
zip demo-videos.zip reelmind-app/public/videos/*.mp4

# 2. 创建 Release 并上传
gh release create v1.0.0 demo-videos.zip \
  --title "v1.0.0" \
  --notes "演示视频资源"
```

视频下载地址：`https://github.com/lggyx/Peel/releases/download/v1.0.0/demo-videos.zip`

应用启动失败时自动降级为空白占位，不影响核心功能。

## 备份

```bash
# 手动执行
bash deploy/backup.sh

# 添加定时任务（每天 3:00 备份）
crontab -e
0 3 * * * /path/to/Peel/deploy/backup.sh
```

备份文件保留 7 天，存放在 `/backup/peel/`。

## 域名与 HTTPS

Caddy 自动申请与续期 Let's Encrypt 证书，确保域名 DNS 已正确解析。

如使用 Cloudflare，请将域名 DNS 设为「仅 DNS」模式（不启用代理），
或添加 `tls` 配置指定证书颁发机构。

## 日志查看

```bash
# 应用日志
docker logs peel-app -f

# Caddy 日志
docker logs peel-caddy -f

# 访问日志
docker exec peel-caddy tail -f /data/access.log
```

## 更新部署

```bash
cd Peel
git pull origin refactor/peel
docker compose -f deploy/docker-compose.yml up -d --build
```

## 资源限制

- peel-app：内存 512M，CPU 1 核
- peel-caddy：内存 128M，CPU 0.5 核

合计约 640M 内存，2 核 CPU 足够运行。
