# CodeSandbox 部署指南

CodeSandbox 是一个在线开发平台，也支持部署 Python 应用。

## 部署步骤

### 1. 注册和登录

1. 访问 [https://codesandbox.io](https://codesandbox.io)
2. 使用 GitHub 账号登录

### 2. 导入项目

1. 登录后，点击 "Create Sandbox"
2. 选择 "Import from GitHub"
3. 输入您的仓库地址：`https://github.com/zhipinglin-art/commute-tracker`
4. 点击 "Import and Continue"

### 3. 配置环境

1. 在左侧文件列表中找到项目
2. 打开终端（按 `Ctrl+~` 或点击终端图标）
3. 在终端中运行：
   ```
   pip install -r requirements.txt
   ```

### 4. 启动应用

1. 在终端中运行：
   ```
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
2. CodeSandbox 会自动创建一个公开的 URL
3. 点击预览窗口中的 URL 查看应用

### 5. 获取永久 URL

1. 点击右上角的 "Share" 按钮
2. 选择 "Share as public sandbox"
3. 复制并分享这个 URL

## 注意事项

- CodeSandbox 主要用于开发和演示
- 免费版可能有使用时长限制
- 适合短期使用和测试