# 腾讯云服务器部署通勤记录应用详细指南

本指南将手把手教您如何在腾讯云服务器上部署通勤记录应用，获得完全独立的公网访问地址。

## 前期准备

### 1. 注册腾讯云账户

1. 访问 [腾讯云官网](https://cloud.tencent.com)
2. 点击右上角的 "免费注册"
3. 按照提示完成注册流程
4. 完成实名认证（需要上传身份证信息）

### 2. 购买云服务器

腾讯云提供多种服务器，推荐使用轻量应用服务器（Lighthouse）：

1. 登录腾讯云控制台
2. 点击 "产品" > "轻量应用服务器 Lighthouse"
3. 点击 "新建实例"
4. 选择配置：
   - **地域**：选择离您最近的区域（如广州、上海等）
   - **镜像**：选择 "Ubuntu 20.04" 或 "CentOS 7.6"
   - **套餐**：选择最便宜的套餐（如 2核 2GB 内存）
   - **数据盘**：默认即可（40GB 或 50GB）
   - **网络**：默认配置
   - **购买时长**：建议先选择 1 个月测试
5. 设置实例名称和登录密码
6. 点击 "立即购买" 并完成支付

> **提示**：腾讯云经常有优惠活动，新用户可以享受低价购买服务器

---

## 连接到服务器

### 方法一：使用腾讯云网页端控制台

1. 进入腾讯云控制台
2. 点击 "轻量应用服务器"
3. 找到您刚创建的实例
4. 点击右侧的 "登录" 按钮
5. 在弹出的网页终端中输入您设置的密码

### 方法二：使用 SSH 客户端（推荐）

1. 在您的电脑上打开终端（Mac/Linux）或 PuTTY（Windows）
2. 使用以下命令连接：
   ```
   ssh root@您的服务器IP地址
   ```
3. 输入您设置的密码

> **获取IP地址**：在腾讯云控制台的服务器详情页可以看到公网IP

---

## 服务器环境配置

### 1. 更新系统

**对于 Ubuntu：**
```bash
apt update
apt upgrade -y
```

**对于 CentOS：**
```bash
yum update -y
```

### 2. 安装 Python 3 和 pip

**对于 Ubuntu：**
```bash
apt install python3 python3-pip python3-venv -y
```

**对于 CentOS：**
```bash
yum install python3 python3-pip -y
```

### 3. 安装 Nginx（用于反向代理）

```bash
# Ubuntu
apt install nginx -y

# CentOS
yum install nginx -y
```

### 4. 安装 Git

```bash
# Ubuntu
apt install git -y

# CentOS
yum install git -y
```

---

## 部署应用代码

### 1. 克隆您的 GitHub 仓库

```bash
cd /var/www
git clone https://github.com/zhipinglin-art/commute-tracker.git
cd commute-tracker
```

### 2. 创建 Python 虚拟环境

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. 安装 Python 依赖

```bash
pip install -r requirements.txt
```

### 4. 测试应用运行

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

如果看到类似 `Uvicorn running on http://0.0.0.0:8000` 的输出，说明应用运行成功。

按 `Ctrl+C` 停止应用。

---

## 配置系统服务

### 1. 创建 systemd 服务文件

```bash
nano /etc/systemd/system/commute-tracker.service
```

添加以下内容：

```ini
[Unit]
Description=Commute Tracker FastAPI App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/commute-tracker
Environment="PATH=/var/www/commute-tracker/venv/bin"
ExecStart=/var/www/commute-tracker/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

保存并退出（按 `Ctrl+X`，然后按 `Y`，再按 `Enter`）。

### 2. 修改文件权限

```bash
chown -R www-data:www-data /var/www/commute-tracker
chmod -R 755 /var/www/commute-tracker
```

### 3. 启用和启动服务

```bash
systemctl enable commute-tracker
systemctl start commute-tracker
systemctl status commute-tracker
```

如果状态显示为 `active (running)`，说明服务启动成功。

---

## 配置 Nginx 反向代理

### 1. 创建 Nginx 配置文件

```bash
nano /etc/nginx/sites-available/commute-tracker
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name 您的域名;  # 如果没有域名，可以使用服务器IP

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件直接由 Nginx 提供
    location /static/ {
        alias /var/www/commute-tracker/static/;
    }
}
```

### 2. 启用配置

```bash
ln -s /etc/nginx/sites-available/commute-tracker /etc/nginx/sites-enabled/
nginx -t  # 检查配置是否有语法错误
systemctl restart nginx
```

---

## 配置 SSL 证书（可选但推荐）

### 1. 安装 Certbot

```bash
# Ubuntu
apt install certbot python3-certbot-nginx -y

# CentOS
yum install certbot python3-certbot-nginx -y
```

### 2. 获取 SSL 证书

如果您有域名，运行：
```bash
certbot --nginx -d 您的域名
```

按照提示完成证书安装。Certbot 会自动配置 Nginx 并设置证书自动续期。

> **注意**：如果您使用 IP 地址而非域名，可以跳过此步骤，或使用自签名证书

---

## 防火墙配置

### 1. 开放必要端口

```bash
# Ubuntu (UFW)
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
ufw enable

# CentOS (firewalld)
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

### 2. 在腾讯云控制台配置安全组

1. 登录腾讯云控制台
2. 进入您的实例详情页
3. 点击 "防火墙" 或 "安全组" 标签
4. 点击 "添加规则"，添加以下规则：
   - **SSH**：端口 22，来源 0.0.0.0/0
   - **HTTP**：端口 80，来源 0.0.0.0/0
   - **HTTPS**：端口 443，来源 0.0.0.0/0

---

## 测试和访问

### 1. 检查应用状态

```bash
systemctl status commute-tracker
systemctl status nginx
```

两个服务都应该显示为 `active (running)`。

### 2. 在浏览器中访问

在浏览器中输入您的服务器 IP 地址或域名：
- `http://您的服务器IP`
- 或 `https://您的域名`（如果配置了 SSL）

### 3. 测试 API

访问 `http://您的IP/docs` 或 `https://您的域名/docs` 查看 API 文档。

---

## 在 iPhone 上使用

### 1. 直接访问

1. 在 iPhone Safari 中输入您的服务器 IP 或域名
2. 测试应用功能

### 2. 添加到主屏幕

1. 在 Safari 中打开应用
2. 点击分享按钮
3. 选择 "添加到主屏幕"
4. 点击 "添加"

---

## 更新和维护

### 1. 更新应用代码

```bash
cd /var/www/commute-tracker
git pull
source venv/bin/activate
pip install -r requirements.txt  # 安装新依赖
systemctl restart commute-tracker
```

### 2. 查看日志

```bash
# 查看应用日志
journalctl -u commute-tracker -f

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 备份和恢复

### 1. 备份数据库

```bash
# 如果使用 SQLite
cp /var/www/commute-tracker/data/commute_tracker.db /backup/$(date +%Y%m%d)_commute_tracker.db

# 如果使用 MySQL 或其他数据库，使用相应的备份命令
```

### 2. 设置自动备份（可选）

创建一个备份脚本：
```bash
nano /usr/local/bin/backup-commute.sh
```

添加以下内容：
```bash
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份 SQLite 数据库
cp /var/www/commute-tracker/data/commute_tracker.db $BACKUP_DIR/${DATE}_commute_tracker.db

# 保留最近30天的备份
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
```

设置执行权限：
```bash
chmod +x /usr/local/bin/backup-commute.sh
```

添加到 crontab 中，每天凌晨2点自动备份：
```bash
crontab -e
```

添加一行：
```
0 2 * * * /usr/local/bin/backup-commute.sh
```

---

## 故障排除

### 1. 应用无法启动

**检查服务状态：**
```bash
systemctl status commute-tracker
```

**查看详细日志：**
```bash
journalctl -u commute-tracker -f
```

**常见问题：**
- 端口被占用：检查是否有其他程序使用了8000端口
- 依赖安装失败：进入虚拟环境重新安装依赖
- 权限问题：确保文件属于 `www-data` 用户

### 2. Nginx 错误

**检查 Nginx 状态：**
```bash
systemctl status nginx
```

**检查配置：**
```bash
nginx -t
```

**查看日志：**
```bash
tail -f /var/log/nginx/error.log
```

### 3. 无法从外部访问

**检查防火墙设置：**
```bash
# Ubuntu
ufw status

# CentOS
firewall-cmd --list-all
```

**检查腾讯云安全组：**
1. 登录腾讯云控制台
2. 进入实例详情页
3. 检查安全组规则是否包含 HTTP(80) 和 HTTPS(443) 端口

---

## 费用说明

使用腾讯云服务器的费用主要包括：

1. **服务器费用**：
   - 轻量应用服务器（2核2GB）：约 50-80 元/月（新用户有优惠）
   - 标准云服务器（类似配置）：约 100+ 元/月

2. **流量费用**：
   - 轻量应用服务器通常包含一定流量
   - 超出部分按量计费（个人通勤记录应用流量很小）

3. **其他费用**：
   - 域名（可选）：约 50-100 元/年
   - SSL 证书：使用免费的 Let's Encrypt，无需费用

对于个人通勤记录应用，最便宜的轻量应用服务器完全足够，总费用非常低。

---

## 总结

通过以上步骤，您已经在腾讯云服务器上成功部署了通勤记录应用，并获得了完全独立的公网访问地址。相比平台即服务（PaaS）解决方案，自建服务器具有以下优势：

1. **完全控制**：不受平台限制，可以自由配置
2. **性能更稳定**：没有休眠机制，24小时可用
3. **成本更低**：长期来看，自建服务器更经济
4. **扩展性强**：可以随时升级配置或部署其他应用

现在您可以在任何设备上访问您的通勤记录应用，包括 iPhone，并享受稳定、快速的服务。

如果您在部署过程中遇到任何问题，请参考故障排除部分，或联系腾讯云技术支持。