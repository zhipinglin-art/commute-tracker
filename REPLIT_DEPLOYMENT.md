# 在 Replit 上部署通勤记录应用

Replit 是一个无需信用卡的免费平台，非常适合快速部署 Python 应用。

## 部署步骤

### 1. 注册和登录

1. 访问 [replit.com](https://replit.com)
2. 点击 "Sign up" 使用 GitHub 账号注册
3. 授权 Replit 访问您的 GitHub 仓库

### 2. 导入项目

1. 登录后，点击左上角的 "+" 按钮
2. 选择 "Import from GitHub"
3. 输入您的仓库地址：`https://github.com/zhipinglin-art/commute-tracker`
4. 给项目命名（例如：commute-tracker）
5. 点击 "Import from GitHub"

### 3. 配置运行环境

导入完成后：

1. 在左侧文件列表中，找到并打开 `main.py`
2. 点击顶部的 "Run" 按钮
3. Replit 会自动安装依赖并运行应用
4. 等待几分钟，直到看到 "Running on..." 的输出

### 4. 获取公网 URL

运行成功后，Replit 会在顶部窗口显示一个公网 URL：
- 格式类似：`your-app-name.your-username.repl.co`
- 点击这个 URL 即可访问您的应用

### 5. 在 iPhone 上使用

1. **直接访问**：
   - 在 iPhone 的 Safari 浏览器中输入上述 URL
   - 开始使用应用

2. **添加到主屏幕**：
   - 在 Safari 中打开应用
   - 点击底部的分享按钮
   - 选择 "添加到主屏幕"
   - 应用图标将出现在主屏幕上

### 6. 设置自动启动

为了让应用保持运行：

1. 在 Replit 编辑器中，点击右上角的齿轮图标
2. 找到 "Always On" 选项（需要 Hacker Plan，但免费版每次访问都会唤醒应用）
3. 或者，添加一个简单的 keep-alive 脚本

### 7. 环境变量配置（可选）

如果您想使用 PostgreSQL 而不是 SQLite：

1. 在左侧边栏中，点击工具图标（锁形状）
2. 点击 "Secrets"
3. 添加环境变量：
   - `DB_HOST`: 数据库主机
   - `DB_USER`: 数据库用户名
   - `DB_PASSWORD`: 数据库密码
   - `DB_NAME`: 数据库名称

## 注意事项

1. **休眠限制**：
   - Replit 免费版有休眠限制
   - 应用 15-30 分钟无活动会休眠
   - 再次访问时会自动唤醒

2. **数据持久性**：
   - 如果不配置外部数据库，应用将使用 SQLite
   - SQLite 文件存储在 Replit 上，重启后数据会保留
   - 但长时间不使用可能导致数据丢失

3. **流量限制**：
   - 免费版有一定流量限制
   - 日常个人使用通常足够

## 替代方案：Glitch.com

如果 Replit 不满足需求，也可以尝试 Glitch：

1. 访问 [glitch.com](https://glitch.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project" > "Import from GitHub"
4. 输入仓库地址并导入
5. 获得的 URL 格式为：`app-name.glitch.me`

这两个平台都不需要信用卡，适合快速部署和测试。