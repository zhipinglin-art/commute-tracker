# 通勤记录应用部署到公网指南

本指南将帮助您将通勤时间记录应用部署到公网，使其能够在 iPhone 上访问，不受局域网限制。

## 为什么选择 Render.com？（推荐）

由于 Railway 免费计划限制，我们推荐使用 **Render.com**，它具有以下优势：
- 🆓 完全免费用于 Web 服务部署
- 🚀 部署速度快，几秒钟内完成
- 🔄 自动从 GitHub 部署，代码推送即自动更新
- 📱 支持 HTTPS，移动端友好
- ⚙️ 无需复杂配置，自动检测项目类型

## 备选方案

### 1. Vercel
- 主要用于前端，但支持 Python API
- 部署速度快
- 适合 API 和前端一同部署

### 2. Heroku
- 经典 PaaS 平台
- 免费额度有限制
- 适合小型应用

### 3. PythonAnywhere
- 专门用于 Python 应用
- 提供免费级别
- 设置简单

## 部署步骤（以 Render.com 为例）

### 第一步：注册和登录 Render

1. 访问 [render.com](https://render.com)
2. 点击 "Sign Up" 使用 GitHub 账号注册（推荐）
3. 授权 Render 访问您的 GitHub 仓库

### 第二步：创建新 Web 服务

1. 登录后，点击 "New +" > "Web Service"
2. 从列表中选择您的 `commute-tracker` 仓库（https://github.com/zhipinglin-art/commute-tracker）
3. 配置部署设置（通常 Render 会自动检测 Python 项目）：
   - Name: `commute-tracker`（或自定义）
   - Region: 选择最近的区域
   - Branch: `main`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. 点击 "Create Web Service"

Render 会自动部署您的应用，并根据 `render.yaml` 配置进行设置。

### 第三步：配置环境变量（可选）

您的应用可以使用 SQLite（默认）或 PostgreSQL：

1. 如果要使用 PostgreSQL：
   - 在项目页面，点击 "New +" > "PostgreSQL"
   - 创建数据库后，查看 "Connection" 信息
   - 在 Web Service 设置中，添加环境变量：
     - `DB_HOST`: 从连接信息中获取
     - `DB_PORT`: 从连接信息中获取
     - `DB_USER`: 从连接信息中获取
     - `DB_PASSWORD`: 从连接信息中获取
     - `DB_NAME`: 从连接信息中获取

2. 如果不配置这些变量，应用将自动使用 SQLite 数据库（无需额外配置）

### 第四步：获取公网 URL

部署完成后，Render 会为您的应用分配一个公网 URL：
- 格式类似：`your-app-name.onrender.com`
- 自动支持 HTTPS

### 第五步：在 iPhone 上使用

1. **直接访问**：在 iPhone 浏览器中输入公网 URL
2. **添加到主屏幕**：
   - 在 Safari 中打开应用
   - 点击底部的分享按钮
   - 选择 "添加到主屏幕"
   - 应用图标将出现在主屏幕上，像原生应用一样使用
3. **离线支持**：应用已配置 Service Worker，支持离线使用（但数据同步需要网络）

## Vercel 部署步骤

如果您更喜欢使用 Vercel：

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号注册
3. 点击 "New Project"
4. 选择您的 `commute-tracker` 仓库
5. Vercel 会自动检测项目并配置
6. 点击 "Deploy"

部署完成后，您会得到一个 `.vercel.app` 的 URL。

## 高级配置选项

### 自定义域名

如果您想使用自己的域名：
1. 在 Render 项目设置中点击 "Custom Domains"
2. 添加您的域名（例如：commute.example.com）
3. 按照指示配置 DNS 记录

### 数据库初始化

如果使用 PostgreSQL，您可能需要初始化数据库表：
1. 通过 Render 控制台的 Shell 连接到应用
2. 运行：`python3 init_database.py`

### 监控和日志

Render 提供内置监控：
- 在 "Logs" 标签页查看应用日志
- 在 "Metrics" 标签页查看性能指标
- 设置警报通知

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

1. 检查 Render 项目状态：确保服务正在运行
2. 查看日志：在 Render 控制台的 "Logs" 标签页
3. 检查环境变量：确保数据库连接正确

### 数据同步问题

1. 检查网络连接
2. 确认后端 API 正常响应
3. 查看浏览器控制台错误信息

### 离线功能不工作

1. 确认 Service Worker 已安装：Safari 开发者菜单 > Web 检查器 > 控制台
2. 清除缓存后重新访问应用
3. 确保使用 HTTPS（Render 自动提供）

## 安全考虑

1. **API 访问控制**：考虑添加认证机制
2. **数据加密**：确保敏感数据传输使用 HTTPS
3. **输入验证**：后端已有基本的输入验证
4. **依赖更新**：定期更新 Python 依赖

## 结论

通过 Render 部署后，您的通勤记录应用将可在任何支持 Web 的设备上访问，包括 iPhone。PWA 特性使其体验接近原生应用，同时保留了 Web 应用的灵活性。

整个过程只需要几分钟，无需复杂的服务器配置，非常适合个人项目快速上线。