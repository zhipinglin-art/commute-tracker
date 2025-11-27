import pymysql
import os
import sys

# 数据库配置
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "eb9no2qf"),
    "charset": "utf8mb4"
}

def init_database():
    """初始化数据库表结构"""
    try:
        print("正在连接数据库...")
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("正在创建表结构...")
        
        # 读取SQL文件
        with open('database_schema.sql', 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # 执行SQL
        cursor.execute(sql)
        conn.commit()
        
        print("✓ 数据库表结构创建成功！")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"✗ 数据库初始化失败: {str(e)}")
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
