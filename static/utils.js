// 显示Toast提示
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'linear-gradient(135deg, #8B6F47 0%, #A67C52 100%)' : 'linear-gradient(135deg, #C17767 0%, #A67C52 100%)';
    const emoji = type === 'success' ? '✅' : '⚠️';
    toast.className = 'toast text-white';
    toast.style.background = bgColor;
    toast.innerHTML = `
        <div class="flex items-center">
            <span class="text-xl mr-2">${emoji}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 格式化日期
export function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// 格式化时间
export function formatTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 格式化时长
export function formatDuration(minutes) {
    if (!minutes && minutes !== 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
        return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
}

// 计算两个时间的差值（分钟）
export function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / 1000 / 60);
}

// 获取星期几
export function getWeekday(dateStr) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const date = new Date(dateStr);
    return weekdays[date.getDay()];
}

// API请求封装
export async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || '请求失败');
        }

        return data;
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}

// 显示加载状态
export function showLoading(element) {
    element.innerHTML = `
        <div class="text-center py-8 text-gray-500">
            <div class="loading mx-auto mb-2"></div>
            <div>加载中...</div>
        </div>
    `;
}

// 显示空状态
export function showEmpty(element, message = '暂无数据') {
    element.innerHTML = `
        <div class="text-center py-12 text-gray-400">
            <i class="fas fa-inbox text-5xl mb-4"></i>
            <div class="text-lg">${message}</div>
        </div>
    `;
}

// 显示错误状态
export function showError(element, message = '加载失败') {
    element.innerHTML = `
        <div class="text-center py-12 text-red-400">
            <i class="fas fa-exclamation-triangle text-5xl mb-4"></i>
            <div class="text-lg">${message}</div>
        </div>
    `;
}