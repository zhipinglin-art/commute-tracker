import sqlite3
import os

# 创建数据目录
os.makedirs("data", exist_ok=True)

# 连接SQLite数据库
conn = sqlite3.connect("data/commute_tracker.db")
conn.row_factory = sqlite3.Row

# 创建表结构
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='commute_records'")
if not cursor.fetchone():
    cursor.execute("""
    CREATE TABLE commute_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_eng_name VARCHAR(100) NOT NULL,
        date TEXT NOT NULL,
        weekday TEXT NOT NULL,
        weather TEXT,
        temperature TEXT,
        transport_type VARCHAR(20) NOT NULL,
        commute_type VARCHAR(20) NOT NULL,
        start_time TEXT,
        on_vehicle_time TEXT,
        arrive_time TEXT,
        total_duration INTEGER,
        rating INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    print("表创建成功")

# 测试查询
sql = "SELECT * FROM commute_records WHERE user_eng_name = ?"
params = ["test"]
print(f"执行SQL: {sql}")
print(f"参数: {params}")

try:
    cursor.execute(sql, params)
    records = cursor.fetchall()
    print(f"查询成功，返回 {len(records)} 条记录")
except Exception as e:
    print(f"查询失败: {e}")

conn.close()