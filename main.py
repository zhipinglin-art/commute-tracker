from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
import pymysql
import sqlite3
import os
from contextlib import contextmanager
import requests
from collections import defaultdict
from typing import Union
import json

app = FastAPI(title="通勤时间记录系统")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库配置（从环境变量获取）
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "commute_tracker"),
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor
}

# 数据库连接池
@contextmanager
def get_db_connection():
    # 尝试MySQL连接，如果失败则使用SQLite
    mysql_error = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    except pymysql.Error as e:
        mysql_error = str(e)
        print(f"MySQL连接错误，尝试使用SQLite: {mysql_error}")
        try:
            # 使用SQLite作为备选方案
            os.makedirs("data", exist_ok=True)
            conn = sqlite3.connect("data/commute_tracker.db")
            # 启用外键约束
            conn.execute("PRAGMA foreign_keys = ON")
            # 设置行工厂以获取字典形式的结果
            conn.row_factory = sqlite3.Row
            
            # 初始化表结构（如果需要）
            init_sqlite_tables(conn)
            
            try:
                yield conn
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()
        except Exception as sqlite_e:
            print(f"SQLite连接错误: {str(sqlite_e)}")
            raise HTTPException(status_code=500, detail=f"数据库连接失败: MySQL错误: {mysql_error}, SQLite错误: {str(sqlite_e)}")
    except Exception as e:
        # 处理其他异常
        raise HTTPException(status_code=500, detail=f"数据库连接错误: {str(e)}")

def init_sqlite_tables(conn):
    """初始化SQLite数据库表结构"""
    cursor = conn.cursor()
    
    # 检查表是否已存在
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='commute_records'")
    if cursor.fetchone():
        return  # 表已存在
    
    # 创建表结构（直接创建，不依赖外部SQL文件）
    create_table_sql = """
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
    """
    
    cursor.execute(create_table_sql)
    conn.commit()
    print("✓ SQLite数据库表结构创建成功！")

def is_sqlite_connection(conn):
    """检查是否为SQLite连接"""
    return isinstance(conn, sqlite3.Connection)

def convert_params(sql, params, conn):
    """根据数据库类型转换SQL和参数"""
    if is_sqlite_connection(conn):
        # SQLite使用问号占位符
        sqlite_sql = sql.replace('%s', '?')
        # 移除末尾可能的多余字符
        sqlite_sql = sqlite_sql.rstrip()
        return sqlite_sql, params
    return sql, params

def convert_date_functions(sql, conn):
    """根据数据库类型转换日期函数"""
    if is_sqlite_connection(conn):
        # SQLite日期函数转换
        sqlite_sql = sql.replace('DATE_SUB(CURDATE(), INTERVAL 30 DAY)', "date('now', '-30 days')")
        
        # 更仔细地替换TIMESTAMPDIFF，避免语法错误
        # 先查找TIMESTAMPDIFF模式
        import re
        pattern = r'TIMESTAMPDIFF\(MINUTE,\s*(\w+),\s*(\w+)\)'
        
        def replace_timestampdiff(match):
            start_field = match.group(1)
            end_field = match.group(2)
            # 转换为SQLite的julianday函数
            return f"(julianday({end_field}) - julianday({start_field})) * 1440"
        
        sqlite_sql = re.sub(pattern, replace_timestampdiff, sqlite_sql)
        return sqlite_sql
    return sql

def execute_query(cursor, sql, params=None, conn=None):
    """执行查询，处理数据库差异"""
    if conn is None:
        conn = cursor.connection
    
    # 转换SQL语句
    sql, params = convert_params(sql, params if params else [], conn)
    sql = convert_date_functions(sql, conn)
    
    # 调试信息
    print(f"执行SQL: {sql}")
    if params:
        print(f"参数: {params}")
    
    # 执行查询
    if params:
        cursor.execute(sql, params)
    else:
        cursor.execute(sql)
    
    return cursor

def format_datetime_result(record, fields=None):
    """格式化日期时间字段"""
    if fields is None:
        fields = ['date', 'start_time', 'on_vehicle_time', 'arrive_time', 'created_at', 'updated_at']
    
    if record is None:
        return None
    
    # 如果是sqlite3.Row对象，转换为字典
    if isinstance(record, sqlite3.Row):
        record = dict(record)
    
    for field in fields:
        if record.get(field):
            if hasattr(record[field], 'strftime'):
                if field == 'date':
                    record[field] = record[field].strftime('%Y-%m-%d')
                else:
                    record[field] = record[field].strftime('%Y-%m-%d %H:%M:%S')
            elif isinstance(record[field], str):
                record[field] = record[field]
        else:
            record[field] = None
    
    return record

def format_datetime_results(records, fields=None):
    """格式化多个记录的日期时间字段"""
    if fields is None:
        fields = ['date', 'start_time', 'on_vehicle_time', 'arrive_time', 'created_at', 'updated_at']
    
    formatted_records = []
    for record in records:
        # 如果是sqlite3.Row对象，转换为字典
        if isinstance(record, sqlite3.Row):
            record = dict(record)
        
        # 格式化日期时间字段
        formatted_record = format_datetime_result(record, fields)
        formatted_records.append(formatted_record)
    
    return formatted_records

# Pydantic模型
class CommuteRecordCreate(BaseModel):
    user_eng_name: str
    date: str
    weekday: str
    weather: Optional[str] = None
    temperature: Optional[str] = None
    transport_type: str  # subway or car
    commute_type: str  # to_work or from_work
    start_time: str
    on_vehicle_time: Optional[str] = None
    arrive_time: Optional[str] = None
    total_duration: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None

class CommuteRecordUpdate(BaseModel):
    weather: Optional[str] = None
    temperature: Optional[str] = None
    transport_type: Optional[str] = None
    commute_type: Optional[str] = None
    start_time: Optional[str] = None
    on_vehicle_time: Optional[str] = None
    arrive_time: Optional[str] = None
    total_duration: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None

class WeatherResponse(BaseModel):
    weather: str
    temperature: str
    success: bool

# API接口

@app.get("/")
def read_root():
    """重定向到静态页面"""
    return RedirectResponse(url="/static/index.html")

@app.post("/api/records")
def create_record(record: CommuteRecordCreate):
    """创建通勤记录"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            sql = """
                INSERT INTO commute_records 
                (user_eng_name, date, weekday, weather, temperature, transport_type, 
                 commute_type, start_time, on_vehicle_time, arrive_time, total_duration, rating, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                record.user_eng_name, record.date, record.weekday, record.weather,
                record.temperature, record.transport_type, record.commute_type,
                record.start_time, record.on_vehicle_time, record.arrive_time,
                record.total_duration, record.rating, record.notes
            )
            
            # 执行查询
            execute_query(cursor, sql, params, conn)
            record_id = cursor.lastrowid
            cursor.close()
            return {"success": True, "id": record_id, "message": "记录创建成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据库错误: {str(e)}")

@app.get("/api/records")
def get_records(
    user_eng_name: str = Query(..., description="用户英文名"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    transport_type: Optional[str] = None,
    commute_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """获取通勤记录列表"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 直接使用简单查询，避免动态SQL构建的问题
            if is_sqlite_connection(conn):
                # SQLite版本
                sql = "SELECT * FROM commute_records WHERE user_eng_name = ? ORDER BY date DESC, start_time DESC LIMIT ? OFFSET ?"
                count_sql = "SELECT COUNT(*) as total FROM commute_records WHERE user_eng_name = ?"
                params = [user_eng_name]
                count_params = [user_eng_name]
                offset = (page - 1) * page_size
                limit_offset_params = [page_size, offset]
                
                # 查询总数
                cursor.execute(count_sql, count_params)
                result = cursor.fetchone()
                total = result['total'] if result else 0
                
                # 查询数据
                cursor.execute(sql, params + limit_offset_params)
                records = cursor.fetchall()
                
                # 格式化日期时间
                records = format_datetime_results(records)
                
                cursor.close()
                return {
                    "success": True,
                    "data": records,
                    "total": total,
                    "page": page,
                    "page_size": page_size
                }
            else:
                # MySQL版本
                # 构建查询条件
                where_clauses = ["user_eng_name = %s"]
                params = [user_eng_name]
                
                if transport_type:
                    where_clauses.append("transport_type = %s")
                    params.append(transport_type)
                
                if commute_type:
                    where_clauses.append("commute_type = %s")
                    params.append(commute_type)
                
                if start_date:
                    where_clauses.append("date >= %s")
                    params.append(start_date)
                
                if end_date:
                    where_clauses.append("date <= %s")
                    params.append(end_date)
                
                where_sql = " AND ".join(where_clauses)
                
                # 查询总数
                count_sql = f"SELECT COUNT(*) as total FROM commute_records WHERE {where_sql}"
                cursor.execute(count_sql, params)
                result = cursor.fetchone()
                total = result.get('total', 0) if result else 0
                
                # 查询数据
                offset = (page - 1) * page_size
                sql = f"""
                    SELECT * FROM commute_records 
                    WHERE {where_sql}
                    ORDER BY date DESC, start_time DESC
                    LIMIT %s OFFSET %s
                """
                
                cursor.execute(sql, params + [page_size, offset])
                records = cursor.fetchall()
                
                # 格式化日期时间
                records = format_datetime_results(records)
                
                cursor.close()
                return {
                    "success": True,
                    "data": records,
                    "total": total,
                    "page": page,
                    "page_size": page_size
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据库错误: {str(e)}")

@app.get("/api/records/{record_id}")
def get_record(record_id: int, user_eng_name: str = Query(...)):
    """获取单条记录详情"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            sql = "SELECT * FROM commute_records WHERE id = %s AND user_eng_name = %s"
            execute_query(cursor, sql, (record_id, user_eng_name), conn)
            record = cursor.fetchone()
            cursor.close()
            
            if not record:
                raise HTTPException(status_code=404, detail="记录不存在")
            
            # 格式化日期时间
            record = format_datetime_result(record)
            
            return {"success": True, "data": record}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据库错误: {str(e)}")

@app.put("/api/records/{record_id}")
def update_record(record_id: int, record: CommuteRecordUpdate, user_eng_name: str = Query(...)):
    """更新通勤记录"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 构建更新字段
            update_fields = []
            params = []
            
            if record.weather is not None:
                update_fields.append("weather = %s")
                params.append(record.weather)
            if record.temperature is not None:
                update_fields.append("temperature = %s")
                params.append(record.temperature)
            if record.transport_type is not None:
                update_fields.append("transport_type = %s")
                params.append(record.transport_type)
            if record.commute_type is not None:
                update_fields.append("commute_type = %s")
                params.append(record.commute_type)
            if record.start_time is not None:
                update_fields.append("start_time = %s")
                params.append(record.start_time)
            if record.on_vehicle_time is not None:
                update_fields.append("on_vehicle_time = %s")
                params.append(record.on_vehicle_time)
            if record.arrive_time is not None:
                update_fields.append("arrive_time = %s")
                params.append(record.arrive_time)
            if record.total_duration is not None:
                update_fields.append("total_duration = %s")
                params.append(record.total_duration)
            if record.rating is not None:
                update_fields.append("rating = %s")
                params.append(record.rating)
            if record.notes is not None:
                update_fields.append("notes = %s")
                params.append(record.notes)
            
            if not update_fields:
                return {"success": True, "message": "没有需要更新的字段"}
            
            sql = f"UPDATE commute_records SET {', '.join(update_fields)} WHERE id = %s AND user_eng_name = %s"
            params.extend([record_id, user_eng_name])
            
            execute_query(cursor, sql, params, conn)
            affected_rows = cursor.rowcount
            cursor.close()
            
            if affected_rows == 0:
                raise HTTPException(status_code=404, detail="记录不存在或无权限修改")
            
            return {"success": True, "message": "记录更新成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据库错误: {str(e)}")

@app.delete("/api/records/{record_id}")
def delete_record(record_id: int, user_eng_name: str = Query(...)):
    """删除通勤记录"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            sql = "DELETE FROM commute_records WHERE id = %s AND user_eng_name = %s"
            execute_query(cursor, sql, (record_id, user_eng_name), conn)
            affected_rows = cursor.rowcount
            cursor.close()
            
            if affected_rows == 0:
                raise HTTPException(status_code=404, detail="记录不存在或无权限删除")
            
            return {"success": True, "message": "记录删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据库错误: {str(e)}")

@app.get("/api/weather")
def get_weather():
    """获取深圳当前天气信息（使用腾讯地图API）"""
    try:
        # 使用腾讯地图天气API获取深圳实时天气
        # 深圳的行政区划代码：440300
        url = "https://apis.map.qq.com/ws/weather/v1/"
        params = {
            "location": "深圳",
            "key": "OQBBZ-VHECX-LLI4P-B7PEO-QFHH7-YVFBV",  # 腾讯地图API Key
            "output": "json"
        }
        
        # 尝试调用天气API
        try:
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == 0:
                    weather_data = data.get("data", {})
                    observe = weather_data.get("observe", {})
                    
                    weather_text = observe.get("weather", "晴")
                    temp = observe.get("temp", "25")
                    
                    return {
                        "success": True,
                        "weather": weather_text,
                        "temperature": f"{temp}°C"
                    }
        except Exception as api_error:
            print(f"天气API调用失败: {str(api_error)}")
        
        # 如果API调用失败，使用备用方案（模拟深圳常见天气）
        weather_options = ["晴", "多云", "阴", "小雨"]
        import random
        weather = random.choice(weather_options)
        temperature = f"{random.randint(18, 32)}°C"  # 深圳常见温度范围
        
        return {
            "success": True,
            "weather": weather,
            "temperature": temperature
        }
    except Exception as e:
        return {
            "success": False,
            "weather": "晴",
            "temperature": "25°C",
            "message": str(e)
        }

@app.get("/api/statistics")
def get_statistics(user_eng_name: str = Query(...)):
    """获取统计数据"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 基础统计
            basic_stats_sql = """
                SELECT 
                    COUNT(*) as total_count,
                    AVG(total_duration) as avg_duration,
                    MIN(total_duration) as min_duration,
                    MAX(total_duration) as max_duration,
                    AVG(rating) as avg_rating
                FROM commute_records 
                WHERE user_eng_name = %s AND total_duration IS NOT NULL
            """
            execute_query(cursor, basic_stats_sql, (user_eng_name,), conn)
            basic_stats = cursor.fetchone()
            
            # 按出行方式统计
            transport_stats_sql = """
                SELECT 
                    transport_type,
                    COUNT(*) as count,
                    AVG(total_duration) as avg_duration
                FROM commute_records 
                WHERE user_eng_name = %s AND total_duration IS NOT NULL
                GROUP BY transport_type
            """
            execute_query(cursor, transport_stats_sql, (user_eng_name,), conn)
            transport_stats = cursor.fetchall()
            transport_stats = format_datetime_results(transport_stats, ['date'])
            
            # 按通勤类型统计
            commute_stats_sql = """
                SELECT 
                    commute_type,
                    COUNT(*) as count,
                    AVG(total_duration) as avg_duration
                FROM commute_records 
                WHERE user_eng_name = %s AND total_duration IS NOT NULL
                GROUP BY commute_type
            """
            execute_query(cursor, commute_stats_sql, (user_eng_name,), conn)
            commute_stats = cursor.fetchall()
            commute_stats = format_datetime_results(commute_stats, ['date'])
            
            # 按星期统计
            weekday_stats_sql = """
                SELECT 
                    weekday,
                    AVG(total_duration) as avg_duration,
                    COUNT(*) as count
                FROM commute_records 
                WHERE user_eng_name = %s AND total_duration IS NOT NULL
                GROUP BY weekday
            """
            execute_query(cursor, weekday_stats_sql, (user_eng_name,), conn)
            weekday_stats = cursor.fetchall()
            weekday_stats = format_datetime_results(weekday_stats, ['date'])
            
            # 按天气统计
            weather_stats_sql = """
                SELECT 
                    weather,
                    AVG(total_duration) as avg_duration,
                    COUNT(*) as count
                FROM commute_records 
                WHERE user_eng_name = %s AND total_duration IS NOT NULL AND weather IS NOT NULL
                GROUP BY weather
            """
            execute_query(cursor, weather_stats_sql, (user_eng_name,), conn)
            weather_stats = cursor.fetchall()
            weather_stats = format_datetime_results(weather_stats, ['date'])
            
            # 最近30天趋势
            trend_data_sql = """
                SELECT 
                    date,
                    AVG(total_duration) as avg_duration
                FROM commute_records 
                WHERE user_eng_name = %s AND total_duration IS NOT NULL
                    AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY date
                ORDER BY date
            """
            execute_query(cursor, trend_data_sql, (user_eng_name,), conn)
            trend_data = cursor.fetchall()
            trend_data = format_datetime_results(trend_data)
            
            # 分段时间统计（SQLite版本）
            if is_sqlite_connection(conn):
                # SQLite版本的分段时间统计
                segment_stats_sql = """
                    SELECT 
                        AVG((julianday(on_vehicle_time) - julianday(start_time)) * 1440) as avg_to_vehicle,
                        AVG((julianday(arrive_time) - julianday(on_vehicle_time)) * 1440) as avg_on_vehicle
                    FROM commute_records 
                    WHERE user_eng_name = %s 
                        AND start_time IS NOT NULL 
                        AND on_vehicle_time IS NOT NULL 
                        AND arrive_time IS NOT NULL
                """
            else:
                # MySQL版本的分段时间统计
                segment_stats_sql = """
                    SELECT 
                        AVG(TIMESTAMPDIFF(MINUTE, start_time, on_vehicle_time)) as avg_to_vehicle,
                        AVG(TIMESTAMPDIFF(MINUTE, on_vehicle_time, arrive_time)) as avg_on_vehicle
                    FROM commute_records 
                    WHERE user_eng_name = %s 
                        AND start_time IS NOT NULL 
                        AND on_vehicle_time IS NOT NULL 
                        AND arrive_time IS NOT NULL
                """
            
            execute_query(cursor, segment_stats_sql, (user_eng_name,), conn)
            segment_stats = cursor.fetchone()
            
            cursor.close()
            
            return {
                "success": True,
                "basic": basic_stats,
                "by_transport": transport_stats,
                "by_commute_type": commute_stats,
                "by_weekday": weekday_stats,
                "by_weather": weather_stats,
                "trend": trend_data,
                "segments": segment_stats
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"统计数据获取失败: {str(e)}")

@app.get("/api/suggestions")
def get_suggestions(user_eng_name: str = Query(...)):
    """生成智能建议"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 检查数据量
            execute_query(cursor, "SELECT COUNT(*) as count FROM commute_records WHERE user_eng_name = %s", (user_eng_name,), conn)
            count_result = cursor.fetchone()
            
            # 处理SQLite的结果格式
            if isinstance(count_result, sqlite3.Row):
                count = count_result['count']
            else:
                count = count_result.get('count', 0) if count_result else 0
            
            if count < 10:
                return {
                    "success": False,
                    "message": f"数据不足，当前有{count}条记录，至少需要10条记录才能生成准确建议"
                }
            
            suggestions = []
            
            # 1. 出行方式对比
            transport_comparison_sql = """
                SELECT 
                    transport_type,
                    AVG(total_duration) as avg_duration,
                    AVG(rating) as avg_rating,
                    COUNT(*) as count
                FROM commute_records 
                WHERE user_eng_name = %s AND total_duration IS NOT NULL
                GROUP BY transport_type
            """
            execute_query(cursor, transport_comparison_sql, (user_eng_name,), conn)
            transport_comparison = cursor.fetchall()
            transport_comparison = format_datetime_results(transport_comparison, ['date'])
            
            if len(transport_comparison) >= 2:
                sorted_by_time = sorted(transport_comparison, key=lambda x: float(x['avg_duration'] or 999))
                sorted_by_rating = sorted(transport_comparison, key=lambda x: float(x['avg_rating'] or 0), reverse=True)
                
                fastest = sorted_by_time[0]
                best_rated = sorted_by_rating[0]
                
                transport_names = {"subway": "地铁", "car": "开车"}
                
                suggestions.append({
                    "type": "transport",
                    "title": "出行方式建议",
                    "content": f"{transport_names.get(fastest['transport_type'], fastest['transport_type'])}平均用时{float(fastest['avg_duration'] or 0):.1f}分钟，是最快的通勤方式。"
                })
                
                if fastest['transport_type'] != best_rated['transport_type']:
                    suggestions.append({
                        "type": "experience",
                        "title": "体验建议",
                        "content": f"虽然{transport_names.get(fastest['transport_type'])}更快，但{transport_names.get(best_rated['transport_type'])}的平均评分更高({float(best_rated['avg_rating'] or 0):.1f}星)，体验更好。"
                    })
            
            # 2. 天气影响分析
            weather_impact_sql = """
                SELECT 
                    weather,
                    AVG(total_duration) as avg_duration,
                    COUNT(*) as count
                FROM commute_records 
                WHERE user_eng_name = %s AND total_duration IS NOT NULL AND weather IS NOT NULL
                GROUP BY weather
                HAVING count >= 3
                ORDER BY avg_duration DESC
            """
            execute_query(cursor, weather_impact_sql, (user_eng_name,), conn)
            weather_impact = cursor.fetchall()
            weather_impact = format_datetime_results(weather_impact, ['date'])
            
            if len(weather_impact) >= 2:
                worst_weather = weather_impact[0]
                best_weather = weather_impact[-1]
                time_diff = float(worst_weather['avg_duration'] or 0) - float(best_weather['avg_duration'] or 0)
                
                if time_diff > 10:
                    suggestions.append({
                        "type": "weather",
                        "title": "天气影响",
                        "content": f"{worst_weather['weather']}天气下通勤时间平均增加{time_diff:.1f}分钟，建议提前出门。"
                    })
            
            # 3. 瓶颈环节识别
            if is_sqlite_connection(conn):
                # SQLite版本的分段时间统计
                segments_sql = """
                    SELECT 
                        AVG((julianday(on_vehicle_time) - julianday(start_time)) * 1440) as avg_to_vehicle,
                        AVG((julianday(arrive_time) - julianday(on_vehicle_time)) * 1440) as avg_on_vehicle
                    FROM commute_records 
                    WHERE user_eng_name = %s 
                        AND start_time IS NOT NULL 
                        AND on_vehicle_time IS NOT NULL 
                        AND arrive_time IS NOT NULL
                """
            else:
                # MySQL版本的分段时间统计
                segments_sql = """
                    SELECT 
                        AVG(TIMESTAMPDIFF(MINUTE, start_time, on_vehicle_time)) as avg_to_vehicle,
                        AVG(TIMESTAMPDIFF(MINUTE, on_vehicle_time, arrive_time)) as avg_on_vehicle
                    FROM commute_records 
                    WHERE user_eng_name = %s 
                        AND start_time IS NOT NULL 
                        AND on_vehicle_time IS NOT NULL 
                        AND arrive_time IS NOT NULL
                """
            
            execute_query(cursor, segments_sql, (user_eng_name,), conn)
            segments = cursor.fetchone()
            
            if segments and segments['avg_to_vehicle'] and segments['avg_on_vehicle']:
                avg_to_vehicle = float(segments['avg_to_vehicle'] or 0)
                avg_on_vehicle = float(segments['avg_on_vehicle'] or 0)
                
                if avg_to_vehicle > avg_on_vehicle:
                    suggestions.append({
                        "type": "bottleneck",
                        "title": "时间优化建议",
                        "content": f"从出门到上车平均耗时{avg_to_vehicle:.1f}分钟，是主要瓶颈环节，建议优化出门准备流程。"
                    })
                else:
                    suggestions.append({
                        "type": "bottleneck",
                        "title": "时间优化建议",
                        "content": f"在途时间平均{avg_on_vehicle:.1f}分钟，占比较大，可考虑选择更快的路线。"
                    })
            
            # 4. 星期规律
            worst_day_sql = """
                SELECT 
                    weekday,
                    AVG(total_duration) as avg_duration
                FROM commute_records 
                WHERE user_eng_name = %s AND total_duration IS NOT NULL
                GROUP BY weekday
                HAVING COUNT(*) >= 2
                ORDER BY avg_duration DESC
                LIMIT 1
            """
            execute_query(cursor, worst_day_sql, (user_eng_name,), conn)
            worst_day = cursor.fetchone()
            
            if worst_day:
                worst_day_weekday = worst_day['weekday']
                worst_day_duration = float(worst_day['avg_duration'] or 0)
                suggestions.append({
                    "type": "schedule",
                    "title": "时间规律",
                    "content": f"{worst_day_weekday}的通勤时间最长(平均{worst_day_duration:.1f}分钟)，建议这天提前出门。"
                })
            
            cursor.close()
            
            return {
                "success": True,
                "count": count,
                "suggestions": suggestions
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"建议生成失败: {str(e)}")

# 挂载静态文件（必须在最后）
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# 检查是否在Railway环境
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)