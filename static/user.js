// 获取用户信息
export async function getUserInfo() {
    try {
        const response = await fetch('/ts:auth/tauth/info.ashx');
        if (!response.ok) {
            throw new Error('获取用户信息失败');
        }
        
        const data = await response.json();
        
        return {
            engName: data.EngName || 'guest',
            name: data.ChnName || '访客',
            department: data.DeptNameString || '',
            position: data.PositionName || '',
            avatar: `https://r.hrc.woa.com/photo/150/${data.EngName}.png?default_when_absent=true`
        };
    } catch (error) {
        console.error('获取用户信息失败:', error);
        // 返回默认用户信息
        return {
            engName: 'guest',
            name: '访客',
            department: '',
            position: '',
            avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="48"%3E?%3C/text%3E%3C/svg%3E'
        };
    }
}
