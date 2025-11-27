import { getUserInfo } from './user.js';
import { initRecordPage } from './record.js';
import { initHistoryPage } from './history.js';
import { initAnalysisPage } from './analysis.js';
import { showToast } from './utils.js';

let currentUser = null;

// 初始化应用
async function initApp() {
    try {
        // 获取用户信息
        currentUser = await getUserInfo();
        
        // 加载自定义用户信息
        loadCustomUserInfo();
        
        // 显示用户信息
        updateUserInfoDisplay();

        // 初始化用户信息编辑功能
        initUserInfoEdit();

        // 初始化各页面
        initRecordPage(currentUser);
        initHistoryPage(currentUser);
        initAnalysisPage(currentUser);

        // 初始化Tab切换
        initTabs();

    } catch (error) {
        console.error('应用初始化失败:', error);
        showToast('应用初始化失败', 'error');
    }
}

// 加载自定义用户信息
function loadCustomUserInfo() {
    const customInfo = localStorage.getItem('customUserInfo');
    if (customInfo) {
        try {
            const info = JSON.parse(customInfo);
            if (info.name) currentUser.name = info.name;
            if (info.avatar) currentUser.avatar = info.avatar;
        } catch (error) {
            console.error('加载自定义用户信息失败:', error);
        }
    }
}

// 更新用户信息显示
function updateUserInfoDisplay() {
    const userInfoEl = document.getElementById('userInfo');
    if (currentUser) {
        userInfoEl.innerHTML = `
            <img src="${currentUser.avatar}" alt="${currentUser.name}" class="w-10 h-10 rounded-full border-2 border-gray-200">
            <span class="font-medium text-gray-700">${currentUser.name}</span>
            <i class="fas fa-edit text-gray-400 text-sm"></i>
        `;
    } else {
        userInfoEl.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <i class="fas fa-user text-gray-600"></i>
            </div>
            <span class="font-medium text-gray-700">访客</span>
            <i class="fas fa-edit text-gray-400 text-sm"></i>
        `;
    }
}

// 初始化用户信息编辑功能
function initUserInfoEdit() {
    const userInfoEl = document.getElementById('userInfo');
    const modal = document.getElementById('userEditModal');
    const btnClose = document.getElementById('btnCloseUserEdit');
    const btnSave = document.getElementById('btnSaveUserInfo');
    const btnReset = document.getElementById('btnResetUserInfo');
    const editUserName = document.getElementById('editUserName');
    const customAvatarUrl = document.getElementById('customAvatarUrl');
    const previewAvatar = document.getElementById('previewAvatar');
    
    let selectedEmoji = null;
    
    // 点击用户信息打开编辑弹窗
    userInfoEl.addEventListener('click', () => {
        openUserEditModal();
    });
    
    // 打开编辑弹窗
    function openUserEditModal() {
        editUserName.value = currentUser?.name || '访客';
        previewAvatar.src = currentUser?.avatar || '';
        
        // 检查当前头像类型
        const customInfo = localStorage.getItem('customUserInfo');
        if (customInfo) {
            try {
                const info = JSON.parse(customInfo);
                if (info.avatarType === 'emoji') {
                    document.querySelector('input[name="avatarType"][value="emoji"]').checked = true;
                    selectedEmoji = info.avatar;
                } else if (info.avatarType === 'url') {
                    document.querySelector('input[name="avatarType"][value="url"]').checked = true;
                    customAvatarUrl.value = info.avatar;
                    customAvatarUrl.disabled = false;
                }
            } catch (error) {
                console.error('解析自定义信息失败:', error);
            }
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    // 关闭弹窗
    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    btnClose.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 头像类型切换
    document.querySelectorAll('input[name="avatarType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            customAvatarUrl.disabled = e.target.value !== 'url';
            
            if (e.target.value === 'system') {
                // 使用系统头像
                const systemAvatar = `https://r.hrc.woa.com/photo/150/${currentUser?.engName || 'guest'}.png?default_when_absent=true`;
                previewAvatar.src = systemAvatar;
            } else if (e.target.value === 'emoji' && selectedEmoji) {
                // 使用选中的emoji
                updateEmojiAvatar(selectedEmoji);
            } else if (e.target.value === 'url' && customAvatarUrl.value) {
                // 使用自定义URL
                previewAvatar.src = customAvatarUrl.value;
            }
        });
    });
    
    // Emoji选择
    document.querySelectorAll('.emoji-option').forEach(option => {
        option.addEventListener('click', () => {
            const emoji = option.dataset.emoji;
            selectedEmoji = emoji;
            
            // 选中emoji类型
            document.querySelector('input[name="avatarType"][value="emoji"]').checked = true;
            customAvatarUrl.disabled = true;
            
            // 更新预览
            updateEmojiAvatar(emoji);
            
            // 高亮选中的emoji
            document.querySelectorAll('.emoji-option').forEach(e => {
                e.style.background = '';
                e.style.borderRadius = '';
            });
            option.style.background = 'var(--maillard-cream)';
            option.style.borderRadius = '0.5rem';
        });
    });
    
    // 自定义URL输入
    customAvatarUrl.addEventListener('input', (e) => {
        if (e.target.value) {
            previewAvatar.src = e.target.value;
        }
    });
    
    // 更新Emoji头像预览
    function updateEmojiAvatar(emoji) {
        const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23F5EFE6' width='100' height='100' rx='50'/%3E%3Ctext x='50' y='70' font-size='50' text-anchor='middle'%3E${emoji}%3C/text%3E%3C/svg%3E`;
        previewAvatar.src = svg;
    }
    
    // 保存用户信息
    btnSave.addEventListener('click', () => {
        const name = editUserName.value.trim() || currentUser?.name || '访客';
        const avatarType = document.querySelector('input[name="avatarType"]:checked').value;
        
        let avatar = currentUser?.avatar;
        
        if (avatarType === 'system') {
            avatar = `https://r.hrc.woa.com/photo/150/${currentUser?.engName || 'guest'}.png?default_when_absent=true`;
        } else if (avatarType === 'emoji' && selectedEmoji) {
            avatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23F5EFE6' width='100' height='100' rx='50'/%3E%3Ctext x='50' y='70' font-size='50' text-anchor='middle'%3E${selectedEmoji}%3C/text%3E%3C/svg%3E`;
        } else if (avatarType === 'url' && customAvatarUrl.value) {
            avatar = customAvatarUrl.value;
        }
        
        // 保存到localStorage
        const customInfo = {
            name: name,
            avatar: avatar,
            avatarType: avatarType
        };
        localStorage.setItem('customUserInfo', JSON.stringify(customInfo));
        
        // 更新当前用户信息
        currentUser.name = name;
        currentUser.avatar = avatar;
        
        // 更新显示
        updateUserInfoDisplay();
        
        closeModal();
        showToast('用户信息已保存！');
    });
    
    // 恢复默认
    btnReset.addEventListener('click', () => {
        if (confirm('确定要恢复默认用户信息吗？')) {
            localStorage.removeItem('customUserInfo');
            
            // 重新获取原始用户信息
            getUserInfo().then(user => {
                currentUser = user;
                updateUserInfoDisplay();
                closeModal();
                showToast('已恢复默认用户信息');
            });
        }
    });
}

// 初始化Tab切换
function initTabs() {
    const tabs = {
        'tabRecord': 'pageRecord',
        'tabHistory': 'pageHistory',
        'tabAnalysis': 'pageAnalysis'
    };

    Object.keys(tabs).forEach(tabId => {
        const tabButton = document.getElementById(tabId);
        tabButton.addEventListener('click', () => {
            // 切换Tab样式
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('tab-active');
            });
            tabButton.classList.add('tab-active');

            // 切换页面内容
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.add('hidden');
            });
            document.getElementById(tabs[tabId]).classList.remove('hidden');

            // 触发页面加载事件
            if (tabId === 'tabHistory') {
                window.dispatchEvent(new CustomEvent('historyPageShow'));
            } else if (tabId === 'tabAnalysis') {
                window.dispatchEvent(new CustomEvent('analysisPageShow'));
            }
        });
    });
}

// 启动应用
initApp();

// 注册Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker 注册成功:', registration.scope);
                
                // 检查更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 发现新版本');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 新版本可用，提示用户刷新
                            if (confirm('发现新版本，是否立即更新？')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.error('❌ Service Worker 注册失败:', error);
            });
        
        // 监听Service Worker控制器变化
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker 已更新');
        });
    });
}

// 检测是否在PWA模式下运行
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    console.log('📱 运行在PWA模式');
    document.body.classList.add('pwa-mode');
}

// 添加安装提示
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💡 可以安装PWA');
    e.preventDefault();
    deferredPrompt = e;
    
    // 显示安装提示（可选）
    showInstallPrompt();
});

// 显示安装提示
function showInstallPrompt() {
    // 检查是否已经显示过或用户已拒绝
    if (localStorage.getItem('pwa-install-dismissed')) {
        return;
    }
    
    const installBanner = document.createElement('div');
    installBanner.className = 'fixed bottom-4 left-4 right-4 p-4 rounded-lg shadow-lg z-50';
    installBanner.style.background = 'linear-gradient(135deg, #8B6F47 0%, #A67C52 100%)';
    installBanner.innerHTML = `
        <div class="flex items-center justify-between text-white">
            <div class="flex items-center flex-1">
                <span class="text-2xl mr-3">📱</span>
                <div>
                    <div class="font-semibold">安装到主屏幕</div>
                    <div class="text-sm opacity-90">获得更好的使用体验</div>
                </div>
            </div>
            <div class="flex space-x-2 ml-4">
                <button id="installBtn" class="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    安装
                </button>
                <button id="dismissBtn" class="px-3 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                    ✕
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    
    // 安装按钮
    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`用户选择: ${outcome}`);
            deferredPrompt = null;
        }
        document.body.removeChild(installBanner);
    });
    
    // 关闭按钮
    document.getElementById('dismissBtn').addEventListener('click', () => {
        localStorage.setItem('pwa-install-dismissed', 'true');
        document.body.removeChild(installBanner);
    });
}

// 监听安装完成
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA 安装成功');
    showToast('应用已添加到主屏幕！');
    deferredPrompt = null;
});

export { currentUser };