import { showToast, formatDate, formatTime, formatDuration, apiRequest, showLoading, showEmpty, showError } from './utils.js';

let currentUser = null;
let currentPage = 1;
let currentFilters = {};
let currentRecordId = null;

export function initHistoryPage(user) {
    currentUser = user;
    
    // 监听页面显示事件
    window.addEventListener('historyPageShow', () => {
        loadRecords();
    });
    
    // 初始化筛选功能
    initFilter();
    
    // 初始化详情弹窗
    initModal();
}

// 初始化筛选
function initFilter() {
    const btnFilter = document.getElementById('btnFilter');
    const filterPanel = document.getElementById('filterPanel');
    const btnApplyFilter = document.getElementById('btnApplyFilter');
    const btnResetFilter = document.getElementById('btnResetFilter');
    
    btnFilter.addEventListener('click', () => {
        filterPanel.classList.toggle('hidden');
    });
    
    btnApplyFilter.addEventListener('click', () => {
        currentFilters = {
            start_date: document.getElementById('filterStartDate').value || undefined,
            end_date: document.getElementById('filterEndDate').value || undefined,
            transport_type: document.getElementById('filterTransport').value || undefined,
            commute_type: document.getElementById('filterCommuteType').value || undefined
        };
        currentPage = 1;
        loadRecords();
        filterPanel.classList.add('hidden');
    });
    
    btnResetFilter.addEventListener('click', () => {
        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';
        document.getElementById('filterTransport').value = '';
        document.getElementById('filterCommuteType').value = '';
        currentFilters = {};
        currentPage = 1;
        loadRecords();
        filterPanel.classList.add('hidden');
    });
}

// 加载记录列表
async function loadRecords() {
    const recordsList = document.getElementById('recordsList');
    showLoading(recordsList);
    
    try {
        const params = new URLSearchParams({
            user_eng_name: currentUser?.engName || 'guest',
            page: currentPage,
            page_size: 10,
            ...currentFilters
        });
        
        const data = await apiRequest(`/api/records?${params}`);
        
        if (data.success && data.data.length > 0) {
            renderRecords(data.data);
            renderPagination(data.total, data.page, data.page_size);
        } else {
            showEmpty(recordsList, '暂无通勤记录');
            document.getElementById('pagination').classList.add('hidden');
        }
    } catch (error) {
        showError(recordsList, '加载失败：' + error.message);
        document.getElementById('pagination').classList.add('hidden');
    }
}

// 渲染记录列表
function renderRecords(records) {
    const recordsList = document.getElementById('recordsList');
    
    const transportIcons = {
        'subway': '🚇',
        'car': '🚗'
    };
    
    const transportNames = {
        'subway': '地铁',
        'car': '开车'
    };
    
    const commuteNames = {
        'to_work': '上班',
        'from_work': '下班'
    };
    
    recordsList.innerHTML = records.map(record => `
        <div class="card-maillard rounded-xl p-4 cursor-pointer" data-id="${record.id}">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <div class="text-lg font-semibold flex items-center" style="color: var(--maillard-dark);">
                        📅 ${formatDate(record.date)} ${record.weekday}
                    </div>
                    <div class="text-sm mt-1" style="color: var(--maillard-accent);">
                        ${transportIcons[record.transport_type]} ${transportNames[record.transport_type]} · ${commuteNames[record.commute_type]}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold" style="color: var(--maillard-brown);">
                        ⏱️ ${formatDuration(record.total_duration)}
                    </div>
                    ${record.rating ? `
                        <div class="text-2xl mt-1">
                            ${['😢', '😕', '😐', '😊', '😄'][record.rating - 1]}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="flex items-center justify-between text-sm" style="color: var(--maillard-accent);">
                <div class="flex items-center space-x-4">
                    <span>
                        🌤️ ${record.weather || '-'}
                    </span>
                    <span>
                        🌡️ ${record.temperature || '-'}
                    </span>
                </div>
                <div class="hover:opacity-70 transition-opacity" style="color: var(--maillard-brown);">
                    查看详情 👉
                </div>
            </div>
        </div>
    `).join('');
    
    // 添加点击事件
    recordsList.querySelectorAll('[data-id]').forEach(card => {
        card.addEventListener('click', () => {
            const recordId = parseInt(card.dataset.id);
            showRecordDetail(recordId);
        });
    });
}

// 渲染分页
function renderPagination(total, page, pageSize) {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(total / pageSize);
    
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }
    
    pagination.classList.remove('hidden');
    
    let html = '';
    
    // 上一页
    if (page > 1) {
        html += `<button class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" data-page="${page - 1}">上一页</button>`;
    }
    
    // 页码
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
            html += `<button class="px-3 py-1 ${i === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'} rounded" data-page="${i}">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += `<span class="px-2">...</span>`;
        }
    }
    
    // 下一页
    if (page < totalPages) {
        html += `<button class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" data-page="${page + 1}">下一页</button>`;
    }
    
    pagination.innerHTML = html;
    
    // 添加点击事件
    pagination.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            loadRecords();
        });
    });
}

// 显示记录详情
async function showRecordDetail(recordId) {
    currentRecordId = recordId;
    
    try {
        const params = new URLSearchParams({
            user_eng_name: currentUser?.engName || 'guest'
        });
        
        const data = await apiRequest(`/api/records/${recordId}?${params}`);
        
        if (data.success) {
            const record = data.data;
            
            const transportNames = {
                'subway': '地铁',
                'car': '开车'
            };
            
            const commuteNames = {
                'to_work': '上班',
                'from_work': '下班'
            };
            
            const detailContent = document.getElementById('detailContent');
            detailContent.innerHTML = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-sm text-gray-500">日期</div>
                            <div class="font-medium">${formatDate(record.date)} ${record.weekday}</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">天气</div>
                            <div class="font-medium">${record.weather || '-'} ${record.temperature || ''}</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-sm text-gray-500">出行方式</div>
                            <div class="font-medium">${transportNames[record.transport_type]}</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">通勤类型</div>
                            <div class="font-medium">${commuteNames[record.commute_type]}</div>
                        </div>
                    </div>
                    
                    <div class="border-t pt-4">
                        <div class="text-sm text-gray-500 mb-2">时间详情</div>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span>出门时间</span>
                                <span class="font-medium">${formatTime(record.start_time)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>上车时间</span>
                                <span class="font-medium">${formatTime(record.on_vehicle_time)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>到达时间</span>
                                <span class="font-medium">${formatTime(record.arrive_time)}</span>
                            </div>
                            <div class="flex justify-between text-lg font-bold text-blue-600 pt-2 border-t">
                                <span>总时长</span>
                                <span>${formatDuration(record.total_duration)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${record.rating ? `
                        <div>
                            <div class="text-sm text-gray-500 mb-1">评分</div>
                            <div class="text-4xl">
                                ${['😢', '😕', '😐', '😊', '😄'][record.rating - 1]}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${record.notes ? `
                        <div>
                            <div class="text-sm text-gray-500 mb-1">备注</div>
                            <div class="text-gray-700">${record.notes}</div>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('detailModal').classList.remove('hidden');
            document.getElementById('detailModal').classList.add('flex');
        }
    } catch (error) {
        showToast('加载详情失败：' + error.message, 'error');
    }
}

// 初始化弹窗
function initModal() {
    const modal = document.getElementById('detailModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCloseModal2 = document.getElementById('btnCloseModal2');
    const btnDeleteRecord = document.getElementById('btnDeleteRecord');
    
    btnCloseModal.addEventListener('click', closeModal);
    btnCloseModal2.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    btnDeleteRecord.addEventListener('click', async () => {
        if (!confirm('确定要删除这条记录吗？')) {
            return;
        }
        
        try {
            const params = new URLSearchParams({
                user_eng_name: currentUser?.engName || 'guest'
            });
            
            const data = await apiRequest(`/api/records/${currentRecordId}?${params}`, {
                method: 'DELETE'
            });
            
            if (data.success) {
                showToast('删除成功');
                closeModal();
                loadRecords();
            }
        } catch (error) {
            showToast('删除失败：' + error.message, 'error');
        }
    });
}

// 关闭弹窗
function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentRecordId = null;
}
