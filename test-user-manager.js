/**
 * 最后修改时间: 2025-07-20 09:29:01
 * 上次修改时间: 2025-07-20 09:28:59
 * 文件大小: 3806 bytes
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = exports.generateUserReport = exports.validateEmail = exports.formatUserInfo = void 0;
class UserManager {
    constructor() {
        this.users = new Map();
        this.userSettings = new Map();
        this.nextId = 1;
        console.log("UserManager 初始化完成");
        this.loadDefaultSettings();
    }
    loadDefaultSettings() {
        console.log("加载默认用户设置");
    }
    createUser(username, email, roles = ['user']) {
        if (!this.validateEmail(email)) {
            throw new Error('无效的邮箱地址');
        }
        const newUser = {
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
    initializeUserSettings(userId) {
        const defaultSettings = {
            theme: 'light',
            language: 'zh-CN',
            notifications: true,
            emailUpdates: false
        };
        this.userSettings.set(userId, defaultSettings);
    }
    getUserById(id) {
        return this.users.get(id);
    }
    getUserSettings(id) {
        return this.userSettings.get(id);
    }
    updateUserStatus(id, isActive) {
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
    updateUserSettings(id, settings) {
        const currentSettings = this.userSettings.get(id);
        if (currentSettings) {
            Object.assign(currentSettings, settings);
            console.log(`用户 ${id} 设置已更新`);
            return true;
        }
        return false;
    }
    getAllActiveUsers() {
        return Array.from(this.users.values()).filter(user => user.isActive);
    }
    getUsersByRole(role) {
        return Array.from(this.users.values()).filter(user => user.roles?.includes(role));
    }
    deleteUser(id) {
        const success = this.users.delete(id);
        if (success) {
            this.userSettings.delete(id);
            console.log(`用户 ID ${id} 已删除`);
        }
        return success;
    }
    getUserCount() {
        return this.users.size;
    }
}
exports.UserManager = UserManager;
// 工具函数
function formatUserInfo(user) {
    const status = user.isActive ? "活跃" : "非活跃";
    const lastLogin = user.lastLogin ? user.lastLogin.toLocaleString() : "从未登录";
    const roles = user.roles?.join(', ') || '无角色';
    return `用户: ${user.username} (${user.email}) - 状态: ${status} - 角色: ${roles} - 最后登录: ${lastLogin}`;
}
exports.formatUserInfo = formatUserInfo;
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.validateEmail = validateEmail;
function generateUserReport(users) {
    const activeCount = users.filter(u => u.isActive).length;
    const totalCount = users.length;
    return `用户报告: 总计 ${totalCount} 人，活跃 ${activeCount} 人 (${Math.round(activeCount / totalCount * 100)}%)`;
}
exports.generateUserReport = generateUserReport;
//# sourceMappingURL=test-user-manager.js.map