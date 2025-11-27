-- 通勤时间记录表
CREATE TABLE IF NOT EXISTS commute_records (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    user_eng_name VARCHAR(100) NOT NULL COMMENT '用户英文名',
    date DATE NOT NULL COMMENT '通勤日期',
    weekday VARCHAR(20) NOT NULL COMMENT '星期几',
    weather VARCHAR(50) COMMENT '天气状况',
    temperature VARCHAR(20) COMMENT '温度',
    transport_type ENUM('subway', 'car') NOT NULL COMMENT '出行方式：subway-地铁，car-开车',
    commute_type ENUM('to_work', 'from_work') NOT NULL COMMENT '通勤类型：to_work-上班，from_work-下班',
    start_time DATETIME NOT NULL COMMENT '出门时间',
    on_vehicle_time DATETIME COMMENT '上车/上地铁时间',
    arrive_time DATETIME COMMENT '到达时间',
    total_duration INT COMMENT '总通勤时长（分钟）',
    rating TINYINT COMMENT '评分（1-5星）',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_date (user_eng_name, date),
    INDEX idx_user_type (user_eng_name, transport_type),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通勤记录表';
