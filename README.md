# 通勤时间记录与分析系统

一个帮助用户记录每日通勤详细信息并提供智能分析建议的Web应用。

## 功能特性

### 📝 通勤记录
- 自动获取日期、星期和天气信息
- 支持地铁和开车两种出行方式
- 分段记录通勤时间（出门、上车、到达）
- 实时计算各段耗时和总时长
- 支持1-5星评分和备注

### 📊 历史记录
- 按时间倒序展示所有通勤记录
- 支持按日期、出行方式、通勤类型筛选
- 查看记录详情
- 编辑和删除记录

### 📈 数据分析
- 基础统计（总次数、平均时长、最短/最长时长）
- 通勤时间趋势图
- 出行方式对比分析
- 星期分布雷达图
- 分段时间占比饼图

### 💡 智能建议
- 基于数据对比推荐最优出行方式
- 分析天气对通勤时间的影响
- 识别通勤瓶颈环节
- 提供针对性优化建议

## 技术栈

- **后端**: Python + FastAPI
- **数据库**: MySQL
- **前端**: 原生JavaScript (ESModule) + Tailwind CSS + ECharts
- **部署**: Docker + Uvicorn

## 环境变量配置

需要配置以下环境变量：

```bash
DB_HOST=数据库地址
DB_PORT=数据库端口
DB_USER=数据库用户名
DB_PASSWORD=数据库密码
DB_NAME=eb9no2qf
```

## 数据库初始化

在首次运行前，需要执行 `database_schema.sql` 文件创建数据表：

```bash
mysql -h <host> -u <user> -p <database> < database_schema.sql
```

## 本地运行

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 配置环境变量

3. 启动服务：
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

4. 访问应用：
- 前端页面: http://localhost:8000/static/index.html
- API文档: http://localhost:8000/docs

## Docker部署

```bash
docker build -t commute-tracker .
docker run -d -p 8000:8000 \
  -e DB_HOST=<host> \
  -e DB_PORT=<port> \
  -e DB_USER=<user> \
  -e DB_PASSWORD=<password> \
  -e DB_NAME=eb9no2qf \
  commute-tracker
```

## 项目结构

```
.
├── main.py                 # FastAPI后端主程序
├── database_schema.sql     # 数据库表结构
├── requirements.txt        # Python依赖
├── Dockerfile             # Docker配置
├── README.md              # 项目说明
└── static/                # 前端文件
    ├── index.html         # 页面入口
    ├── main.js           # 主入口JS
    ├── user.js           # 用户模块
    ├── utils.js          # 工具函数
    ├── record.js         # 记录页面
    ├── history.js        # 历史页面
    └── analysis.js       # 分析页面
```

## API接口

### 通勤记录
- `POST /api/records` - 创建记录
- `GET /api/records` - 获取记录列表
- `GET /api/records/{id}` - 获取记录详情
- `PUT /api/records/{id}` - 更新记录
- `DELETE /api/records/{id}` - 删除记录

### 数据分析
- `GET /api/statistics` - 获取统计数据
- `GET /api/suggestions` - 获取智能建议
- `GET /api/weather` - 获取天气信息

## 注意事项

1. 数据库名称必须为 `eb9no2qf`
2. 所有数据操作基于用户英文名进行隔离
3. 智能建议需要至少10条记录才能生成
4. 天气API当前使用模拟数据，可替换为真实API

## License

MIT
