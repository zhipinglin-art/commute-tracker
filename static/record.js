import { showToast, getWeekday, calculateDuration, formatDuration, apiRequest } from './utils.js';

let currentUser = null;
let timeRecords = {
    startTime: null,
    onVehicleTime: null,
    arriveTime: null
};
let currentRating = 0;

export function initRecordPage(user) {
    currentUser = user;
    
    // 初始化日期
    const today = new Date();
    const dateInput = document.getElementById('recordDate');
    dateInput.value = today.toISOString().split('T')[0];
    updateWeekday();
    
    // 日期变化时更新星期
    dateInput.addEventListener('change', updateWeekday);
    
    // 根据当前时间自动选择通勤类型
    const currentHour = today.getHours();
    const commuteTypeSelect = document.getElementById('recordCommuteType');
    if (currentHour < 12) {
        // 上午（0-11点）自动选择"上班"
        commuteTypeSelect.value = 'to_work';
    } else {
        // 下午/晚上（12-23点）自动选择"下班"
        commuteTypeSelect.value = 'from_work';
    }
    
    // 获取天气信息
    loadWeather();
    
    // 初始化时间记录按钮
    initTimeButtons();
    
    // 初始化评分
    initRating();
    
    // 初始化提交按钮
    initSubmit();
}

// 更新星期显示
function updateWeekday() {
    const dateInput = document.getElementById('recordDate');
    const weekdayInput = document.getElementById('recordWeekday');
    weekdayInput.value = getWeekday(dateInput.value);
}

// 加载天气信息
async function loadWeather() {
    try {
        const data = await apiRequest('/api/weather');
        
        const weatherSelect = document.getElementById('recordWeather');
        const temperatureInput = document.getElementById('recordTemperature');
        
        // 设置天气选项
        weatherSelect.innerHTML = `
            <option value="晴">☀️ 晴</option>
            <option value="多云">⛅ 多云</option>
            <option value="阴">☁️ 阴</option>
            <option value="小雨">🌦️ 小雨</option>
            <option value="中雨">🌧️ 中雨</option>
            <option value="大雨">⛈️ 大雨</option>
            <option value="雪">❄️ 雪</option>
        `;
        
        if (data.success && data.weather) {
            weatherSelect.value = data.weather;
            temperatureInput.value = data.temperature;
        }
    } catch (error) {
        console.error('获取天气失败:', error);
        const weatherSelect = document.getElementById('recordWeather');
        weatherSelect.innerHTML = `
            <option value="晴">☀️ 晴</option>
            <option value="多云">⛅ 多云</option>
            <option value="阴">☁️ 阴</option>
            <option value="小雨">🌦️ 小雨</option>
            <option value="中雨">🌧️ 中雨</option>
            <option value="大雨">⛈️ 大雨</option>
            <option value="雪">❄️ 雪</option>
        `;
    }
}

// 初始化时间记录按钮
function initTimeButtons() {
    const btnStartTime = document.getElementById('btnStartTime');
    const btnOnVehicleTime = document.getElementById('btnOnVehicleTime');
    const btnArriveTime = document.getElementById('btnArriveTime');
    
    btnStartTime.addEventListener('click', () => recordTime('start'));
    btnOnVehicleTime.addEventListener('click', () => recordTime('onVehicle'));
    btnArriveTime.addEventListener('click', () => recordTime('arrive'));
}

// 记录时间
function recordTime(type) {
    const now = new Date();
    // 只记录到分钟，秒设为00
    const timeStr = now.toISOString().slice(0, 16).replace('T', ' ') + ':00';
    const displayTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    if (type === 'start') {
        timeRecords.startTime = timeStr;
        updateTimeDisplay('start', displayTime, timeStr);
        document.getElementById('btnStartTime').classList.add('recorded');
        document.getElementById('btnOnVehicleTime').disabled = false;
        document.getElementById('btnOnVehicleTime').classList.remove('opacity-50');
    } else if (type === 'onVehicle') {
        timeRecords.onVehicleTime = timeStr;
        updateTimeDisplay('onVehicle', displayTime, timeStr);
        document.getElementById('btnOnVehicleTime').classList.add('recorded');
        document.getElementById('btnArriveTime').disabled = false;
        document.getElementById('btnArriveTime').classList.remove('opacity-50');
        
        // 计算第一段时长
        const duration1 = calculateDuration(timeRecords.startTime, timeRecords.onVehicleTime);
        document.getElementById('duration1').textContent = formatDuration(duration1);
        document.getElementById('durationSummary').classList.remove('hidden');
    } else if (type === 'arrive') {
        timeRecords.arriveTime = timeStr;
        updateTimeDisplay('arrive', displayTime, timeStr);
        document.getElementById('btnArriveTime').classList.add('recorded');
        
        // 计算第二段时长和总时长
        const duration2 = calculateDuration(timeRecords.onVehicleTime, timeRecords.arriveTime);
        const totalDuration = calculateDuration(timeRecords.startTime, timeRecords.arriveTime);
        
        document.getElementById('duration2').textContent = formatDuration(duration2);
        document.getElementById('totalDuration').textContent = formatDuration(totalDuration);
    }
}

// 更新时间显示并添加编辑功能
function updateTimeDisplay(type, displayTime, fullTimeStr) {
    const displayMap = {
        'start': 'startTimeDisplay',
        'onVehicle': 'onVehicleTimeDisplay',
        'arrive': 'arriveTimeDisplay'
    };
    
    const displayId = displayMap[type];
    const displayEl = document.getElementById(displayId);
    
    // 创建可编辑的时间显示
    displayEl.innerHTML = `
        <span class="time-value cursor-pointer hover:text-blue-600 transition-colors" title="点击编辑">
            ${displayTime}
            <i class="fas fa-edit text-xs ml-1 opacity-50"></i>
        </span>
    `;
    
    // 添加点击编辑事件
    displayEl.querySelector('.time-value').addEventListener('click', () => {
        showTimeEditDialog(type, fullTimeStr);
    });
}

// 显示时间编辑对话框
function showTimeEditDialog(type, currentTimeStr) {
    const typeNames = {
        'start': '出门时间',
        'onVehicle': '上车/上地铁时间',
        'arrive': '到达时间'
    };
    
    // 提取时间部分 (HH:MM)
    const timePart = currentTimeStr.split(' ')[1] || '00:00:00';
    const [hours, minutes] = timePart.split(':');
    
    // 创建编辑对话框
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-bold mb-4">编辑${typeNames[type]}</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">时间</label>
                    <div class="flex space-x-2 items-center justify-center">
                        <input type="number" id="editHours" min="0" max="23" value="${hours}" 
                            class="w-24 px-3 py-2 border border-gray-300 rounded-md text-center text-lg focus:ring-2 focus:ring-blue-500" 
                            placeholder="时">
                        <span class="text-2xl font-bold">:</span>
                        <input type="number" id="editMinutes" min="0" max="59" value="${minutes}" 
                            class="w-24 px-3 py-2 border border-gray-300 rounded-md text-center text-lg focus:ring-2 focus:ring-blue-500" 
                            placeholder="分">
                    </div>
                </div>
                <div class="flex justify-end space-x-2 mt-6">
                    <button id="btnCancelEdit" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                        取消
                    </button>
                    <button id="btnConfirmEdit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        确定
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 自动选中小时输入框
    setTimeout(() => {
        dialog.querySelector('#editHours').focus();
        dialog.querySelector('#editHours').select();
    }, 100);
    
    // 取消按钮
    dialog.querySelector('#btnCancelEdit').addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
    
    // 点击背景关闭
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            document.body.removeChild(dialog);
        }
    });
    
    // 确定按钮
    dialog.querySelector('#btnConfirmEdit').addEventListener('click', () => {
        const newHours = dialog.querySelector('#editHours').value.padStart(2, '0');
        const newMinutes = dialog.querySelector('#editMinutes').value.padStart(2, '0');
        
        // 验证输入
        if (newHours < 0 || newHours > 23 || newMinutes < 0 || newMinutes > 59) {
            showToast('请输入有效的时间', 'error');
            return;
        }
        
        // 获取当前日期
        const dateInput = document.getElementById('recordDate');
        const dateStr = dateInput.value;
        
        // 构建新的时间字符串（秒固定为00）
        const newTimeStr = `${dateStr} ${newHours}:${newMinutes}:00`;
        const newDisplayTime = `${newHours}:${newMinutes}`;
        
        // 更新时间记录
        if (type === 'start') {
            timeRecords.startTime = newTimeStr;
            updateTimeDisplay('start', newDisplayTime, newTimeStr);
        } else if (type === 'onVehicle') {
            timeRecords.onVehicleTime = newTimeStr;
            updateTimeDisplay('onVehicle', newDisplayTime, newTimeStr);
        } else if (type === 'arrive') {
            timeRecords.arriveTime = newTimeStr;
            updateTimeDisplay('arrive', newDisplayTime, newTimeStr);
        }
        
        // 重新计算时长
        recalculateDurations();
        
        document.body.removeChild(dialog);
        showToast('时间已更新');
    });
    
    // 支持回车确认
    dialog.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                dialog.querySelector('#btnConfirmEdit').click();
            }
        });
    });
}

// 重新计算所有时长
function recalculateDurations() {
    if (timeRecords.startTime && timeRecords.onVehicleTime) {
        const duration1 = calculateDuration(timeRecords.startTime, timeRecords.onVehicleTime);
        document.getElementById('duration1').textContent = formatDuration(duration1);
        document.getElementById('durationSummary').classList.remove('hidden');
    }
    
    if (timeRecords.onVehicleTime && timeRecords.arriveTime) {
        const duration2 = calculateDuration(timeRecords.onVehicleTime, timeRecords.arriveTime);
        document.getElementById('duration2').textContent = formatDuration(duration2);
    }
    
    if (timeRecords.startTime && timeRecords.arriveTime) {
        const totalDuration = calculateDuration(timeRecords.startTime, timeRecords.arriveTime);
        document.getElementById('totalDuration').textContent = formatDuration(totalDuration);
    }
}

// 初始化评分
function initRating() {
    const emojis = document.querySelectorAll('.emoji');
    
    emojis.forEach(emoji => {
        emoji.addEventListener('click', () => {
            const rating = parseInt(emoji.dataset.rating);
            currentRating = rating;
            
            emojis.forEach((e, index) => {
                if (index < rating) {
                    e.classList.add('active');
                } else {
                    e.classList.remove('active');
                }
            });
        });
        
        emoji.addEventListener('mouseenter', () => {
            const rating = parseInt(emoji.dataset.rating);
            emojis.forEach((e, index) => {
                if (index < rating) {
                    e.classList.add('active');
                } else {
                    e.classList.remove('active');
                }
            });
        });
    });
    
    const ratingContainer = document.getElementById('emojiRating');
    ratingContainer.addEventListener('mouseleave', () => {
        emojis.forEach((e, index) => {
            if (index < currentRating) {
                e.classList.add('active');
            } else {
                e.classList.remove('active');
            }
        });
    });
}

// 初始化提交
function initSubmit() {
    const btnSubmit = document.getElementById('btnSubmit');
    
    btnSubmit.addEventListener('click', async () => {
        // 验证必填字段
        if (!timeRecords.startTime) {
            showToast('请记录出门时间', 'error');
            return;
        }
        
        if (!timeRecords.onVehicleTime) {
            showToast('请记录上车时间', 'error');
            return;
        }
        
        if (!timeRecords.arriveTime) {
            showToast('请记录到达时间', 'error');
            return;
        }
        
        // 收集表单数据
        const dateInput = document.getElementById('recordDate');
        const weekdayInput = document.getElementById('recordWeekday');
        const weatherSelect = document.getElementById('recordWeather');
        const temperatureInput = document.getElementById('recordTemperature');
        const transportSelect = document.getElementById('recordTransport');
        const commuteTypeSelect = document.getElementById('recordCommuteType');
        const notesTextarea = document.getElementById('recordNotes');
        
        const totalDuration = calculateDuration(timeRecords.startTime, timeRecords.arriveTime);
        
        const recordData = {
            user_eng_name: currentUser?.engName || 'guest',
            date: dateInput.value,
            weekday: weekdayInput.value,
            weather: weatherSelect.value,
            temperature: temperatureInput.value,
            transport_type: transportSelect.value,
            commute_type: commuteTypeSelect.value,
            start_time: timeRecords.startTime,
            on_vehicle_time: timeRecords.onVehicleTime,
            arrive_time: timeRecords.arriveTime,
            total_duration: totalDuration,
            rating: currentRating || null,
            notes: notesTextarea.value || null
        };
        
        // 提交数据
        try {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<div class="loading inline-block mr-2"></div>保存中...';
            
            const result = await apiRequest('/api/records', {
                method: 'POST',
                body: JSON.stringify(recordData)
            });
            
            if (result.success) {
                showToast('记录保存成功！');
                resetForm();
            } else {
                showToast('保存失败，请重试', 'error');
            }
        } catch (error) {
            showToast('保存失败：' + error.message, 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-save mr-2"></i>保存记录';
        }
    });
}

// 重置表单
function resetForm() {
    // 重置时间记录
    timeRecords = {
        startTime: null,
        onVehicleTime: null,
        arriveTime: null
    };
    
    document.getElementById('startTimeDisplay').textContent = '未记录';
    document.getElementById('onVehicleTimeDisplay').textContent = '未记录';
    document.getElementById('arriveTimeDisplay').textContent = '未记录';
    
    document.getElementById('btnStartTime').classList.remove('recorded');
    document.getElementById('btnOnVehicleTime').classList.remove('recorded');
    document.getElementById('btnArriveTime').classList.remove('recorded');
    
    document.getElementById('btnOnVehicleTime').disabled = true;
    document.getElementById('btnArriveTime').disabled = true;
    
    document.getElementById('durationSummary').classList.add('hidden');
    
    // 重置评分
    currentRating = 0;
    document.querySelectorAll('.emoji').forEach(emoji => {
        emoji.classList.remove('active');
    });
    
    // 重置备注
    document.getElementById('recordNotes').value = '';
    
    // 重新加载天气
    loadWeather();
}