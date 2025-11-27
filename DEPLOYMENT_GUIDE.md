# 通勤记录应用部署到公网指南

本指南将帮助您将通勤时间记录应用部署到公网，使其能够在 iPhone 上访问，不受局域网限制。

## 为什么选择 Railway？

Railway 是一个现代化的云应用部署平台，具有以下优势：
- 🆓 提供免费额度（足够个人使用）
- 🚀 部署速度快，几秒钟内完成
- 🔄 自动从 GitHub 部署，代码推送即自动更新
- 📱 支持 HTTPS，移动端友好
- ⚙️ 无需复杂配置，自动检测项目类型

## 部署步骤

### 第一步：注册和登录 Railway

1. 访问 [railway.app](https://railway.app)
2. 点击 "Login" 使用 GitHub 账号登录（推荐）
3. 授权 Railway 访问您的 GitHub 仓库

### 第二步：创建新项目

1. 登录后，点击 "New Project" 按钮
2. 选择 "Deploy from GitHub repo"
3. 从列表中选择您的 `commute-tracker` 仓库（https://github.com/zhipinglin-art/commute-tracker）
4. 点击 "Deploy Now"

Railway 会自动检测您的项目类型（FastAPI），并根据 `railway.json` 和 `Dockerfile` 配置进行部署。

### 第三步：配置环境变量

您的应用可能需要数据库连接。Railway 提供免费的 PostgreSQL 数据库：

1. 在项目页面，点击 "New Service" > "Add Database" > "Add PostgreSQL"
2. 数据库创建后，点击它查看 "Connection URL"
3. 在您的应用服务设置中，添加以下环境变量：
   - `DB_HOST`: 从 PostgreSQL 连接 URL 中提取
   - `DB_PORT`: 从 PostgreSQL 连接 URL 中提取
   - `DB_USER`: 从 PostgreSQL 连接 URL 中提取
   - `DB_PASSWORD`: 从 PostgreSQL 连接 URL 中提取
   - `DB_NAME`: 从 PostgreSQL 连接 URL 中提取

或者，您也可以直接使用完整的 `DATABASE_URL` 环境变量（修改代码后使用）。

### 第四步：获取公网 URL

部署完成后，Railway 会为您的应用分配一个公网 URL：
- 格式类似：`your-app-name.up.railway.app`
- 自动支持 HTTPS

### 第五步：在 iPhone 上使用

1. **直接访问**：在 iPhone 浏览器中输入公网 URL
2. **添加到主屏幕**：
   - 在 Safari 中打开应用
   - 点击底部的分享按钮
   - 选择 "添加到主屏幕"
   - 应用图标将出现在主屏幕上，像原生应用一样使用
3. **离线支持**：应用已配置 Service Worker，支持离线使用（但数据同步需要网络）

## 高级配置选项

### 自定义域名

如果您想使用自己的域名：
1. 在项目设置中点击 "Domains"
2. 添加您的域名（例如：commute.example.com）
3. 按照指示配置 DNS 记录

### 数据库初始化

如果使用 PostgreSQL，您可能需要初始化数据库表：
1. 通过 Railway 控制台的 Web Shell 连接到应用
2. 运行：`python3 init_database.py`

### 监控和日志

Railway 提供内置监控：
- 在 "Logs" 标签页查看应用日志
- 在 "Metrics" 标签页查看性能指标
- 设置警报通知

## 其他部署方案（备选）

### 1. Render.com

Render 是另一个类似 Railway 的平台：
1. 注册 [render.com](https://render.com)
2. 连接 GitHub 仓库
3. 选择 "Web Service"
4. 配置环境变量和部署设置

### 2. Heroku

Heroku 是经典的 PaaS 平台：
1. 安装 Heroku CLI
2. 运行：`heroku create`
3. 配置环境变量：`heroku config:set VAR=value`
4. 部署：`git push heroku main`

### 3. 自建 VPS

如果您有自己的 VPS：
1. 安装 Docker 和 Docker Compose
2. 使用提供的 Dockerfile 构建镜像
3. 配置 Nginx 反向代理和 SSL
4. 使用域名和 SSL 证书

## iPhone 使用技巧

### PWA 功能充分利用

您的应用已配置为 PWA（Progressive Web App），在 iPhone 上具有以下功能：
- 离线缓存：即使断网也能访问已缓存的内容
- 后台同步：重新联网后自动同步数据
- 推送通知：未来可添加通勤提醒功能

### 添加到主屏幕

1. 在 Safari 中访问部署后的应用
2. 点击分享按钮（方框向上箭头）
3. 滑动底部选项，找到"添加到主屏幕"
4. 点击"添加"，应用图标将出现在主屏幕

### 性能优化

1. 使用 5G/Wi-Fi 网络获得最佳体验
2. 定期清理 Safari 缓存：设置 > Safari > 清除历史记录与网站数据
3. 确保系统更新到最新版本以获得最佳 PWA 支持

## 故障排除

### 应用加载缓慢

1. 检查 Railway 项目状态：确保服务正在运行
2. 查看日志：在 Railway 控制台的 "Logs" 标签页
3. 检查环境变量：确保数据库连接正确

### 数据同步问题

1. 检查网络连接
2. 确认后端 API 正常响应
3. 查看浏览器控制台错误信息

### 离线功能不工作

1. 确认 Service Worker 已安装：Safari 开发者菜单 > Web 检查器 > 控制台
2. 清除缓存后重新访问应用
3. 确保使用 HTTPS（Railway 自动提供）

## 安全考虑

1. **API 访问控制**：考虑添加认证机制
2. **数据加密**：确保敏感数据传输使用 HTTPS
3. **输入验证**：后端已有基本的输入验证
4. **依赖更新**：定期更新 Python 依赖

## 结论

通过 Railway 部署后，您的通勤记录应用将可在任何支持 Web 的设备上访问，包括 iPhone。PWA 特性使其体验接近原生应用，同时保留了 Web 应用的灵活性。

整个过程只需要几分钟，无需复杂的服务器配置，非常适合个人项目快速上线。