#!/bin/bash

# 腾讯云服务器一键部署脚本
# 使用方法: bash SERVER_SETUP_SCRIPT.sh

echo "=== 腾讯云服务器通勤记录应用部署脚本 ==="

# 更新系统
echo "更新系统包..."
if command -v apt > /dev/null; then
    apt update
    apt upgrade -y
    PKG_MANAGER="apt"
elif command -v yum > /dev/null; then
    yum update -y
    PKG_MANAGER="yum"
else
    echo "不支持的包管理器"
    exit 1
fi

# 安装必要软件
echo "安装必要软件包..."
if [ "$PKG_MANAGER" = "apt" ]; then
    apt install -y python3 python3-pip python3-venv nginx git
elif [ "$PKG_MANAGER" = "yum" ]; then
    yum install -y python3 python3-pip nginx git
fi

# 创建应用目录
echo "创建应用目录..."
mkdir -p /var/www
cd /var/www

# 克隆代码
echo "克隆应用代码..."
git clone https://github.com/zhipinglin-art/commute-tracker.git
cd commute-tracker

# 创建虚拟环境并安装依赖
echo "创建虚拟环境并安装依赖..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 创建systemd服务文件
echo "创建系统服务..."
cat > /etc/systemd/system/commute-tracker.service << EOF
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
EOF

# 设置文件权限
echo "设置文件权限..."
chown -R www-data:www-data /var/www/commute-tracker
chmod -R 755 /var/www/commute-tracker

# 配置Nginx
echo "配置Nginx..."
cat > /etc/nginx/sites-available/commute-tracker << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static/ {
        alias /var/www/commute-tracker/static/;
    }
}
EOF

# 启用Nginx配置
ln -s /etc/nginx/sites-available/commute-tracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 配置防火墙
echo "配置防火墙..."
if command -v ufw > /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
elif command -v firewall-cmd > /dev/null; then
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# 启动服务
echo "启动服务..."
systemctl enable commute-tracker
systemctl start commute-tracker
systemctl enable nginx
systemctl restart nginx

# 显示服务状态
echo "检查服务状态..."
systemctl status commute-tracker --no-pager
systemctl status nginx --no-pager

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)
echo "=================================="
echo "部署完成！"
echo "应用访问地址: http://$SERVER_IP"
echo "API文档地址: http://$SERVER_IP/docs"
echo "=================================="

echo "建议下一步："
echo "1. 在腾讯云控制台开放80和443端口"
echo "2. 考虑配置域名和SSL证书"
echo "3. 定期备份数据库文件"