# 更新的免费部署指南

由于多个平台更改了免费政策，这里提供当前可用的免费部署方案。

## 方案一：Replit.com（最推荐）

Replit 目前仍提供完整的免费方案，支持 Python 应用。

### 部署步骤

1. **访问和注册**
   - 打开 [https://replit.com](https://replit.com)
   - 使用 GitHub 账号注册

2. **导入项目**
   - 登录后，点击左侧的 "+" 按钮
   - 选择 "Import from GitHub"
   - 输入：`https://github.com/zhipinglin-art/commute-tracker`
   - 点击 "Import"

3. **配置运行环境**
   - 等待导入完成
   - 确保左侧文件列表显示了所有项目文件

4. **启动应用**
   - 点击顶部绿色的 "Run" 按钮
   - 等待依赖安装和应用启动
   - 查看终端输出，确认服务正在运行

5. **获取公开 URL**
   - Replit 会在顶部窗口显示公开 URL
   - 格式类似：`your-app-name.your-username.repl.co`

6. **测试应用**
   - 点击 URL 在新标签页打开应用
   - 测试基本功能是否正常

## 方案二：GitHub Codespaces

GitHub 为每个用户提供免费的 Codespaces 使用额度。

### 部署步骤

1. **访问您的 GitHub 仓库**
   - 打开：`https://github.com/zhipinglin-art/commute-tracker`

2. **创建 Codespace**
   - 点击绿色的 "Code" 按钮
   - 选择 "Codespaces" 标签
   - 点击 "New codespace"

3. **配置和运行应用**
   - 等待环境设置完成
   - 在终端中运行：
     ```
     pip install -r requirements.txt
     uvicorn main:app --host 0.0.0.0 --port 8000
     ```

4. **获取 URL**
   - Codespaces 会提供一个临时的公开 URL
   - 这个 URL 在 Codespace 活动期间有效

## 方案三：PythonAnywhere

PythonAnywhere 提供免费的 Web 应用托管。

### 部署步骤

1. **注册账户**
   - 访问 [https://pythonanywhere.com](https://pythonanywhere.com)
   - 注册免费账户

2. **创建 Web 应用**
   - 登录后，进入 "Web" 标签页
   - 点击 "Add a new web app"
   - 选择 "Manual configuration"
   - 选择 Python 版本（如 3.9）
   - 点击 "Next"

3. **上传代码**
   - 使用 Git 上传您的代码
   - 或通过 Web 界面上传文件

4. **配置启动命令**
   - 在 "Virtualenv" 部分，安装依赖：
     ```
     pip install -r requirements.txt
     ```
   - 设置 "WSGI configuration file" 路径

## 在 iPhone 上使用部署的应用

无论您选择哪种方案，部署完成后：

1. **获取公开 URL**
   - 确保可以在任何设备上访问的 URL

2. **在 iPhone Safari 中访问**
   - 输入完整的 URL
   - 测试所有功能

3. **添加到主屏幕**
   - 在 Safari 中打开应用
   - 点击分享按钮（底部向上的箭头）
   - 滑动并选择"添加到主屏幕"
   - 点击"添加"

4. **使用应用**
   - 像原生应用一样使用
   - 记录和分析您的通勤数据

## 平台限制和注意事项

### Replit
- **休眠时间**：15-30 分钟无活动后休眠
- **流量限制**：每月有一定的流量限制
- **稳定性**：对于个人使用完全足够

### GitHub Codespaces
- **使用时长**：每个用户每月有限的免费时长
- **临时性**：URL 在 Codespace 关闭后失效
- **适合**：临时测试和开发

### PythonAnywhere
- **资源限制**：CPU 和内存使用有限制
- **稳定性**：相对稳定，适合长期使用
- **配置复杂**：需要更多配置工作

## 故障排除

### 应用无法启动

1. 检查依赖是否正确安装
2. 查看终端/日志输出
3. 确认启动命令正确

### 功能不完整

1. 检查浏览器控制台错误
2. 确认 API 端点可访问
3. 检查数据库连接

### 数据无法保存

1. 确认使用的是 SQLite（无需额外配置）
2. 检查文件权限
3. 查看平台特定的存储限制

## 结论

虽然多个平台更改了免费政策，Replit 仍然是当前最可靠的免费部署方案。它提供完整的功能、良好的稳定性和简单的部署流程，非常适合通勤记录这样的个人应用。

使用 Replit 部署后，您就可以在任何设备上访问您的通勤记录应用，包括 iPhone，并享受接近原生应用的体验。