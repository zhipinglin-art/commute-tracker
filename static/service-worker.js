const CACHE_NAME = 'commute-tracker-v1';
const urlsToCache = [
  '/static/index.html',
  '/static/main.js',
  '/static/user.js',
  '/static/utils.js',
  '/static/record.js',
  '/static/history.js',
  '/static/analysis.js',
  '/static/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'
];

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 缓存资源');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API请求使用网络优先策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 克隆响应，一份给缓存，一份返回
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // 网络失败时尝试从缓存获取
          return caches.match(request);
        })
    );
    return;
  }

  // 静态资源使用缓存优先策略
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          console.log('[Service Worker] 从缓存返回:', request.url);
          return response;
        }

        console.log('[Service Worker] 从网络获取:', request.url);
        return fetch(request).then(response => {
          // 检查是否是有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
      .catch(error => {
        console.error('[Service Worker] 请求失败:', error);
        // 返回离线页面或默认响应
        if (request.destination === 'document') {
          return caches.match('/static/index.html');
        }
      })
  );
});

// 后台同步
self.addEventListener('sync', event => {
  console.log('[Service Worker] 后台同步:', event.tag);
  if (event.tag === 'sync-records') {
    event.waitUntil(syncRecords());
  }
});

// 同步记录函数
async function syncRecords() {
  try {
    // 这里可以实现离线数据同步逻辑
    console.log('[Service Worker] 同步记录...');
    // 实际实现需要配合IndexedDB存储离线数据
  } catch (error) {
    console.error('[Service Worker] 同步失败:', error);
  }
}

// 推送通知
self.addEventListener('push', event => {
  console.log('[Service Worker] 收到推送消息');
  
  const options = {
    body: event.data ? event.data.text() : '您有新的通勤提醒',
    icon: '/static/icon-192.png',
    badge: '/static/badge-72.png',
    vibrate: [200, 100, 200],
    tag: 'commute-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('通勤时间记录', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 通知被点击');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/static/index.html')
  );
});

// 消息事件 - 与主线程通信
self.addEventListener('message', event => {
  console.log('[Service Worker] 收到消息:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
