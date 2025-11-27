import requests
import json
import random

# API基础URL
base_url = "http://localhost:8000"

# 创建测试数据
test_data = []
weekdays = ["周一", "周二", "周三", "周四", "周五"]
weathers = ["晴", "多云", "阴", "小雨"]
transport_types = ["subway", "car"]
transport_names = {"subway": "地铁", "car": "开车"}
commute_types = ["to_work", "from_work"]
commute_names = {"to_work": "上班", "from_work": "下班"}

# 生成30条记录
for i in range(30):
    # 随机日期（最近30天）
    import datetime
    date_offset = random.randint(0, 29)
    record_date = (datetime.datetime.now() - datetime.timedelta(days=date_offset)).strftime("%Y-%m-%d")
    weekday = weekdays[i % 5]
    
    # 随机天气
    weather = random.choice(weathers)
    temperature = f"{random.randint(18, 30)}°C"
    
    # 随机出行方式
    transport_type = random.choice(transport_types)
    commute_type = random.choice(commute_types)
    
    # 生成时间（上班：早上7-9点，下班：晚上6-8点）
    if commute_type == "to_work":
        hour = random.randint(7, 8)
        minute = random.randint(0, 59)
        start_time = f"{hour:02d}:{minute:02d}:00"
        
        # 上车时间（出门后5-15分钟）
        on_vehicle_hour = hour
        on_vehicle_minute = minute + random.randint(5, 15)
        if on_vehicle_minute >= 60:
            on_vehicle_hour += 1
            on_vehicle_minute -= 60
        
        on_vehicle_time = f"{on_vehicle_hour:02d}:{on_vehicle_minute:02d}:00"
        
        # 到达时间（根据交通类型设定总时长）
        if transport_type == "subway":
            total_minutes = random.randint(40, 70)  # 地铁40-70分钟
        else:
            total_minutes = random.randint(30, 60)  # 开车30-60分钟（不考虑堵车）
        
        # 计算到达时间
        total_seconds = total_minutes * 60
        start_seconds = hour * 3600 + minute * 60
        arrive_seconds = start_seconds + total_seconds
        
        arrive_hour = arrive_seconds // 3600
        arrive_minute = (arrive_seconds % 3600) // 60
        arrive_time = f"{arrive_hour:02d}:{arrive_minute:02d}:00"
    else:  # from_work
        hour = random.randint(18, 19)
        minute = random.randint(0, 59)
        start_time = f"{hour:02d}:{minute:02d}:00"
        
        # 上车时间（出门后5-15分钟）
        on_vehicle_hour = hour
        on_vehicle_minute = minute + random.randint(5, 15)
        if on_vehicle_minute >= 60:
            on_vehicle_hour += 1
            on_vehicle_minute -= 60
        
        on_vehicle_time = f"{on_vehicle_hour:02d}:{on_vehicle_minute:02d}:00"
        
        # 到达时间（根据交通类型设定总时长）
        if transport_type == "subway":
            total_minutes = random.randint(40, 70)  # 地铁40-70分钟
        else:
            total_minutes = random.randint(35, 80)  # 开车35-80分钟（考虑堵车）
        
        # 计算到达时间
        total_seconds = total_minutes * 60
        start_seconds = hour * 3600 + minute * 60
        arrive_seconds = start_seconds + total_seconds
        
        arrive_hour = arrive_seconds // 3600
        if arrive_hour >= 24:
            arrive_hour -= 24
        
        arrive_minute = (arrive_seconds % 3600) // 60
        arrive_time = f"{arrive_hour:02d}:{arrive_minute:02d}:00"
    
    # 随机评分（1-5星）
    rating = random.randint(3, 5)
    
    # 生成备注
    if transport_type == "subway":
        notes_options = ["地铁很准时", "人有点多", "今天地铁很顺利", "换乘很快", "座位很紧张"]
    else:
        notes_options = ["路上有点堵", "今天路况不错", "停车有点难", "开车很舒服", "油价又涨了"]
    
    notes = random.choice(notes_options)
    
    # 创建记录
    record = {
        "user_eng_name": "test",
        "date": record_date,
        "weekday": weekday,
        "weather": weather,
        "temperature": temperature,
        "transport_type": transport_type,
        "commute_type": commute_type,
        "start_time": start_time,
        "on_vehicle_time": on_vehicle_time,
        "arrive_time": arrive_time,
        "total_duration": total_minutes,
        "rating": rating,
        "notes": notes
    }
    
    test_data.append(record)

# 发送数据到API
success_count = 0
for record in test_data:
    try:
        response = requests.post(
            f"{base_url}/api/records",
            headers={"Content-Type": "application/json"},
            json=record
        )
        if response.status_code == 200:
            success_count += 1
            commute_name = commute_names[record['commute_type']]
            transport_name = transport_names[record['transport_type']]
            print(f"成功添加记录: {record['date']} {commute_name} - {transport_name}")
        else:
            print(f"添加记录失败: {response.text}")
    except Exception as e:
        print(f"请求失败: {str(e)}")

print(f"\n共添加 {success_count}/{len(test_data)} 条记录")