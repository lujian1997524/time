/**
 * 最后修改时间: 2025-07-20 09:24:38
 * 上次修改时间: 2025-07-20 09:24:38
 * 文件大小: 4288 bytes
 */
// TypeScript 工具类示例文件
interface UserProfile {
    id: number;
    username: string;
    email: string;
    isActive: boolean;
    lastLogin?: Date;
    roles?: string[];
    createdAt: Date;
}

interface UserSettings {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
    emailUpdates: boolean;
}

class UserManager {
    private users: Map<number, UserProfile> = new Map();
    private userSettings: Map<number, UserSettings> = new Map();
    private nextId: number = 1;

    constructor() {
        console.log("UserManager 初始化完成");
        this.loadDefaultSettings();
    }

    private loadDefaultSettings(): void {
        console.log("加载默认用户设置");
    }

    createUser(username: string, email: string, roles: string[] = ['user']): UserProfile {
        if (!this.validateEmail(email)) {
            throw new Error('无效的邮箱地址');
        }

        const newUser: UserProfile = {
            id: this.nextId++,
            username,
            email,
            isActive: true,
            lastLogin: new Date(),
            roles,
            createdAt: new Date()
        };

        this.users.set(newUser.id, newUser);
        this.initializeUserSettings(newUser.id);
        console.log(`新用户创建: ${username} (角色: ${roles.join(', ')})`);
        return newUser;
    }

    private initializeUserSettings(userId: number): void {
        const defaultSettings: UserSettings = {
            theme: 'light',
            language: 'zh-CN',
            notifications: true,
            emailUpdates: false
        };
        this.userSettings.set(userId, defaultSettings);
    }

    getUserById(id: number): UserProfile | undefined {
        return this.users.get(id);
    }

    getUserSettings(id: number): UserSettings | undefined {
        return this.userSettings.get(id);
    }

    updateUserStatus(id: number, isActive: boolean): boolean {
        const user = this.users.get(id);
        if (user) {
            user.isActive = isActive;
            if (isActive) {
                user.lastLogin = new Date();
            }
            console.log(`用户 ${user.username} 状态更新为: ${isActive ? '激活' : '禁用'}`);
            return true;
        }
        return false;
    }

    updateUserSettings(id: number, settings: Partial<UserSettings>): boolean {
        const currentSettings = this.userSettings.get(id);
        if (currentSettings) {
            Object.assign(currentSettings, settings);
            console.log(`用户 ${id} 设置已更新`);
            return true;
        }
        return false;
    }

    getAllActiveUsers(): UserProfile[] {
        return Array.from(this.users.values()).filter(user => user.isActive);
    }

    getUsersByRole(role: string): UserProfile[] {
        return Array.from(this.users.values()).filter(user => 
            user.roles?.includes(role)
        );
    }

    deleteUser(id: number): boolean {
        const success = this.users.delete(id);
        if (success) {
            this.userSettings.delete(id);
            console.log(`用户 ID ${id} 已删除`);
        }
        return success;
    }

    getUserCount(): number {
        return this.users.size;
    }
}

// 工具函数
export function formatUserInfo(user: UserProfile): string {
    const status = user.isActive ? "活跃" : "非活跃";
    const lastLogin = user.lastLogin ? user.lastLogin.toLocaleString() : "从未登录";
    const roles = user.roles?.join(', ') || '无角色';
    
    return `用户: ${user.username} (${user.email}) - 状态: ${status} - 角色: ${roles} - 最后登录: ${lastLogin}`;
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function generateUserReport(users: UserProfile[]): string {
    const activeCount = users.filter(u => u.isActive).length;
    const totalCount = users.length;
    
    return `用户报告: 总计 ${totalCount} 人，活跃 ${activeCount} 人 (${Math.round(activeCount/totalCount*100)}%)`;
}

export { UserManager, UserProfile, UserSettings };