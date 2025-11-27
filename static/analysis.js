import { showToast, formatDuration, apiRequest, showLoading, showEmpty, showError } from './utils.js';

let currentUser = null;
let charts = {};

export function initAnalysisPage(user) {
    currentUser = user;
    
    // 监听页面显示事件
    window.addEventListener('analysisPageShow', () => {
        loadAnalysisData();
    });
}

// 加载分析数据
async function loadAnalysisData() {
    try {
        const params = new URLSearchParams({
            user_eng_name: currentUser?.engName || 'guest'
        });
        
        // 加载统计数据
        const statsData = await apiRequest(`/api/statistics?${params}`);
        
        if (statsData.success) {
            renderBasicStats(statsData.basic);
            renderTrendChart(statsData.trend);
            renderTransportChart(statsData.by_transport);
            renderWeekdayChart(statsData.by_weekday);
            renderSegmentsChart(statsData.segments);
        }
        
        // 加载建议
        loadSuggestions();
        
    } catch (error) {
        console.error('加载分析数据失败:', error);
        showToast('加载分析数据失败', 'error');
    }
}

// 渲染基础统计
function renderBasicStats(stats) {
    const basicStatsEl = document.getElementById('basicStats');
    
    if (!stats || !stats.total_count) {
        basicStatsEl.innerHTML = `
            <div class="col-span-4 text-center py-8 text-gray-500">
                暂无数据，请先记录通勤信息
            </div>
        `;
        return;
    }
    
    basicStatsEl.innerHTML = `
        <div class="p-4 rounded-lg" style="background: linear-gradient(135deg, #E8DCC4 0%, #D4C5B0 100%);">
            <div class="text-sm mb-1" style="color: var(--maillard-dark);">📈 总通勤次数</div>
            <div class="text-2xl font-bold" style="color: var(--maillard-brown);">${stats.total_count}次</div>
        </div>
        <div class="p-4 rounded-lg" style="background: linear-gradient(135deg, #D4C5B0 0%, #B8956A 100%);">
            <div class="text-sm mb-1" style="color: var(--maillard-dark);">⏱️ 平均时长</div>
            <div class="text-2xl font-bold" style="color: var(--maillard-brown);">${formatDuration(stats.avg_duration)}</div>
        </div>
        <div class="p-4 rounded-lg" style="background: linear-gradient(135deg, #F5EFE6 0%, #E8DCC4 100%);">
            <div class="text-sm mb-1" style="color: var(--maillard-dark);">🚀 最短时长</div>
            <div class="text-2xl font-bold" style="color: var(--maillard-accent);">${formatDuration(stats.min_duration)}</div>
        </div>
        <div class="p-4 rounded-lg" style="background: linear-gradient(135deg, #B8956A 0%, #8B6F47 100%);">
            <div class="text-sm mb-1 text-white">🐌 最长时长</div>
            <div class="text-2xl font-bold text-white">${formatDuration(stats.max_duration)}</div>
        </div>
    `;
}

// 渲染趋势图表
function renderTrendChart(trendData) {
    const chartEl = document.getElementById('chartTrend');
    
    if (!trendData || trendData.length === 0) {
        chartEl.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">暂无数据</div>';
        return;
    }
    
    if (charts.trend) {
        charts.trend.dispose();
    }
    
    charts.trend = echarts.init(chartEl);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>平均时长: {c}分钟'
        },
        xAxis: {
            type: 'category',
            data: trendData.map(item => item.date),
            axisLabel: {
                rotate: 45,
                fontSize: 10
            }
        },
        yAxis: {
            type: 'value',
            name: '时长(分钟)',
            axisLabel: {
                formatter: '{value}'
            }
        },
        series: [{
            data: trendData.map(item => Math.round(item.avg_duration)),
            type: 'line',
            smooth: true,
            itemStyle: {
                color: '#8B6F47'
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0,
                        color: 'rgba(139, 111, 71, 0.3)'
                    }, {
                        offset: 1,
                        color: 'rgba(139, 111, 71, 0.05)'
                    }]
                }
            }
        }],
        grid: {
            left: '10%',
            right: '5%',
            bottom: '15%',
            top: '10%'
        }
    };
    
    charts.trend.setOption(option);
}

// 渲染出行方式对比图表
function renderTransportChart(transportData) {
    const chartEl = document.getElementById('chartTransport');
    
    if (!transportData || transportData.length === 0) {
        chartEl.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">暂无数据</div>';
        return;
    }
    
    if (charts.transport) {
        charts.transport.dispose();
    }
    
    charts.transport = echarts.init(chartEl);
    
    const transportNames = {
        'subway': '地铁',
        'car': '开车'
    };
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                const item = params[0];
                return `${item.name}<br/>平均时长: ${item.value}分钟`;
            }
        },
        xAxis: {
            type: 'category',
            data: transportData.map(item => transportNames[item.transport_type] || item.transport_type)
        },
        yAxis: {
            type: 'value',
            name: '时长(分钟)'
        },
        series: [{
            data: transportData.map(item => Math.round(item.avg_duration)),
            type: 'bar',
            itemStyle: {
                color: function(params) {
                    const colors = ['#8B6F47', '#B8956A'];
                    return colors[params.dataIndex % colors.length];
                }
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}分钟'
            }
        }],
        grid: {
            left: '15%',
            right: '5%',
            bottom: '10%',
            top: '10%'
        }
    };
    
    charts.transport.setOption(option);
}

// 渲染星期分布图表
function renderWeekdayChart(weekdayData) {
    const chartEl = document.getElementById('chartWeekday');
    
    if (!weekdayData || weekdayData.length === 0) {
        chartEl.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">暂无数据</div>';
        return;
    }
    
    if (charts.weekday) {
        charts.weekday.dispose();
    }
    
    charts.weekday = echarts.init(chartEl);
    
    // 按星期排序
    const weekdayOrder = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
    const sortedData = weekdayOrder.map(day => {
        const found = weekdayData.find(item => item.weekday === day);
        return found ? Math.round(found.avg_duration) : 0;
    });
    
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>平均时长: {c}分钟'
        },
        radar: {
            indicator: weekdayOrder.map(day => ({
                name: day,
                max: Math.max(...sortedData) * 1.2
            }))
        },
        series: [{
            type: 'radar',
            data: [{
                value: sortedData,
                name: '平均通勤时长',
                itemStyle: {
                    color: '#8B6F47'
                },
                areaStyle: {
                    color: 'rgba(139, 111, 71, 0.3)'
                }
            }]
        }]
    };
    
    charts.weekday.setOption(option);
}

// 渲染分段时间占比图表
function renderSegmentsChart(segmentsData) {
    const chartEl = document.getElementById('chartSegments');
    
    if (!segmentsData || (!segmentsData.avg_to_vehicle && !segmentsData.avg_on_vehicle)) {
        chartEl.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">暂无数据</div>';
        return;
    }
    
    if (charts.segments) {
        charts.segments.dispose();
    }
    
    charts.segments = echarts.init(chartEl);
    
    const data = [
        { value: Math.round(segmentsData.avg_to_vehicle || 0), name: '出门到上车' },
        { value: Math.round(segmentsData.avg_on_vehicle || 0), name: '上车到到达' }
    ];
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}分钟 ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left'
        },
        series: [{
            type: 'pie',
            radius: '60%',
            data: data,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            label: {
                formatter: '{b}\n{c}分钟 ({d}%)'
            }
        }],
        color: ['#8B6F47', '#B8956A']
    };
    
    charts.segments.setOption(option);
}

// 加载智能建议
async function loadSuggestions() {
    const suggestionsEl = document.getElementById('suggestions');
    
    try {
        const params = new URLSearchParams({
            user_eng_name: currentUser?.engName || 'guest'
        });
        
        const data = await apiRequest(`/api/suggestions?${params}`);
        
        if (!data.success) {
            suggestionsEl.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-3xl mb-2"></i>
                    <div>${data.message}</div>
                </div>
            `;
            return;
        }
        
        if (data.suggestions.length === 0) {
            suggestionsEl.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-check-circle text-3xl mb-2 text-green-500"></i>
                    <div>暂无特别建议，继续保持！</div>
                </div>
            `;
            return;
        }
        
        const typeIcons = {
            'transport': 'fa-route',
            'experience': 'fa-smile',
            'weather': 'fa-cloud-sun',
            'bottleneck': 'fa-exclamation-triangle',
            'schedule': 'fa-calendar-alt'
        };
        
        const typeColors = {
            'transport': 'blue',
            'experience': 'green',
            'weather': 'yellow',
            'bottleneck': 'red',
            'schedule': 'purple'
        };
        
        suggestionsEl.innerHTML = data.suggestions.map(suggestion => {
            const icon = typeIcons[suggestion.type] || 'fa-lightbulb';
            const color = typeColors[suggestion.type] || 'gray';
            
            return `
                <div class="bg-${color}-50 border-l-4 border-${color}-500 p-4 rounded">
                    <div class="flex items-start">
                        <i class="fas ${icon} text-${color}-600 text-xl mr-3 mt-1"></i>
                        <div>
                            <div class="font-semibold text-${color}-800 mb-1">${suggestion.title}</div>
                            <div class="text-${color}-700 text-sm">${suggestion.content}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        suggestionsEl.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-circle text-3xl mb-2"></i>
                <div>加载建议失败</div>
            </div>
        `;
    }
}

// 窗口大小改变时重绘图表
window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => {
        if (chart && chart.resize) {
            chart.resize();
        }
    });
});
