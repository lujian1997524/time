/**
 * 最后修改时间: 2025-07-20 09:23:40
 * 上次修改时间: 2025-07-20 09:23:40
 * 文件大小: 2007 bytes
 */
// TypeScript 工具类示例文件
interface UserProfile {
    id: number;
    username: string;
    email: string;
    isActive: boolean;
    lastLogin?: Date;
}

class UserManager {
    private users: Map<number, UserProfile> = new Map();
    private nextId: number = 1;

    constructor() {
        console.log("UserManager 初始化完成");
    }

    createUser(username: string, email: string): UserProfile {
        const newUser: UserProfile = {
            id: this.nextId++,
            username,
            email,
            isActive: true,
            lastLogin: new Date()
        };

        this.users.set(newUser.id, newUser);
        console.log(`新用户创建: ${username}`);
        return newUser;
    }

    getUserById(id: number): UserProfile | undefined {
        return this.users.get(id);
    }

    updateUserStatus(id: number, isActive: boolean): boolean {
        const user = this.users.get(id);
        if (user) {
            user.isActive = isActive;
            console.log(`用户 ${user.username} 状态更新为: ${isActive ? '激活' : '禁用'}`);
            return true;
        }
        return false;
    }

    getAllActiveUsers(): UserProfile[] {
        return Array.from(this.users.values()).filter(user => user.isActive);
    }

    deleteUser(id: number): boolean {
        const success = this.users.delete(id);
        if (success) {
            console.log(`用户 ID ${id} 已删除`);
        }
        return success;
    }
}

// 工具函数
export function formatUserInfo(user: UserProfile): string {
    const status = user.isActive ? "活跃" : "非活跃";
    const lastLogin = user.lastLogin ? user.lastLogin.toLocaleString() : "从未登录";
    
    return `用户: ${user.username} (${user.email}) - 状态: ${status} - 最后登录: ${lastLogin}`;
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export { UserManager, UserProfile };