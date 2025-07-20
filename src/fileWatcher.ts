/**
 * 最后修改时间: 2025-07-20 09:35:30
 * 上次修改时间: 2025-07-20 09:34:23
 * 文件大小: 11054 bytes
 */
import * as vscode from 'vscode';
import { TimestampProvider } from './timestampProvider';
import { GitManager } from './gitManager';
import { GitIgnoreManager } from './gitIgnoreManager';
import * as path from 'path';

export class FileWatcher implements vscode.Disposable {
    private watchers: vscode.FileSystemWatcher[] = [];
    private disposables: vscode.Disposable[] = [];
    private gitIgnoreManager: GitIgnoreManager;
    private isUpdatingTimestamp: Set<string> = new Set(); // 跟踪正在更新时间戳的文件
    private timestampUpdateTimeout: Map<string, NodeJS.Timeout> = new Map(); // 防抖动
    private lastExternalCheckTime: number = 0; // 记录上次外部操作检查时间

    constructor(
        private timestampProvider: TimestampProvider,
        private gitManager: GitManager
    ) {
        this.gitIgnoreManager = new GitIgnoreManager();
        this.setupWatchers();
        this.setupTextDocumentWatchers();
    }

    private getWorkspaceConfig(): vscode.WorkspaceConfiguration {
        // 获取当前工作区的配置，如果有多个工作区文件夹，使用第一个
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const config = vscode.workspace.getConfiguration('timestampTracker', workspaceFolder?.uri);
        
        // 调试日志：显示当前工作区信息
        console.log(`FileWatcher - 当前工作区: ${workspaceFolder?.name || '未知'} (${workspaceFolder?.uri.fsPath || '无路径'})`);
        console.log(`FileWatcher - 自动提交配置: ${config.get<boolean>('enableAutoCommit')}`);
        
        return config;
    }

    private setupWatchers(): void {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        // 监听所有文件变化
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        
        // 文件创建
        watcher.onDidCreate((uri) => {
            this.onFileChanged(uri, '文件创建');
        });

        // 文件修改
        watcher.onDidChange((uri) => {
            this.onFileChanged(uri, '文件修改');
        });

        // 文件删除
        watcher.onDidDelete((uri) => {
            this.onFileChanged(uri, '文件删除');
        });

        this.watchers.push(watcher);
        this.disposables.push(watcher);
    }

    private setupTextDocumentWatchers(): void {
        // 监听文档保存
        const saveDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
            this.onDocumentSaved(document);
        });

        // 监听文档变更
        const changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
            this.onDocumentChanged(event);
        });

        this.disposables.push(saveDisposable, changeDisposable);
    }

    private onFileChanged(uri: vscode.Uri, changeType: string): void {
        // 使用 GitIgnoreManager 检查文件是否应该被跟踪
        if (!this.gitIgnoreManager.shouldTrackFile(uri.fsPath)) {
            console.log(`跳过被忽略的文件: ${uri.fsPath}`);
            return;
        }

        // 检查是否是插件自己在更新时间戳
        if (this.isUpdatingTimestamp.has(uri.fsPath)) {
            console.log(`跳过时间戳更新引起的文件变化: ${uri.fsPath}`);
            return;
        }

        console.log(`文件变化检测: ${changeType} - ${uri.fsPath}`);
        
        // 立即保存文件的当前修改时间（在添加注释之前）
        let fileModTime: Date | undefined;
        try {
            const stats = require('fs').statSync(uri.fsPath);
            fileModTime = stats.mtime;
            console.log(`保存文件当前修改时间: ${fileModTime.toISOString()}`);
        } catch (error) {
            console.error(`获取文件时间失败: ${error}`);
            fileModTime = undefined;
        }
        
        // 防抖动：清除之前的定时器
        const existingTimeout = this.timestampUpdateTimeout.get(uri.fsPath);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // 延迟处理文件变化，避免频繁触发
        const timeout = setTimeout(() => {
            this.processFileChange(uri, changeType, fileModTime);
            this.timestampUpdateTimeout.delete(uri.fsPath);
        }, 500); // 500ms 延迟

        this.timestampUpdateTimeout.set(uri.fsPath, timeout);
    }

    private processFileChange(uri: vscode.Uri, changeType: string, actualFileModTime?: Date): void {
        // 标记开始更新时间戳
        this.isUpdatingTimestamp.add(uri.fsPath);

        try {
            // 检测是否是外部工具（如Claude Code）的操作
            const isExternalChange = this.isExternalFileChange(changeType);
            
            if (isExternalChange) {
                console.log(`检测到外部工具操作: ${changeType} - ${uri.fsPath}`);
                // 对于外部工具操作，直接添加时间戳注释，使用保存的文件修改时间
                if (actualFileModTime) {
                    this.timestampProvider.addTimestampWithActualTime(uri, actualFileModTime);
                } else {
                    this.timestampProvider.addTimestamp(uri);
                }
            } else {
                // 对于其他变化，只更新时间戳信息
                this.timestampProvider.updateFileTimestamp(uri);
            }
            
            // 记录变化
            this.timestampProvider.updateFileChange(uri.fsPath, changeType);

            // 刷新视图
            this.timestampProvider.refresh();
            
            console.log(`处理文件变化: ${changeType} - ${uri.fsPath}`);
        } finally {
            // 延迟清除标记，确保所有相关操作完成
            setTimeout(() => {
                this.isUpdatingTimestamp.delete(uri.fsPath);
            }, 1000);
        }
    }

    private isExternalFileChange(changeType: string): boolean {
        // 判断是否是外部工具的文件操作
        const now = Date.now();
        
        // 检查是否是文件创建或修改（Claude Code常见操作）
        const isCreateOrModify = changeType === '文件创建' || changeType === '文件修改';
        
        if (!isCreateOrModify) {
            return false;
        }
        
        // 检查时间模式：如果在短时间内有多个文件操作，很可能是工具批量操作
        const lastCheck = this.lastExternalCheckTime || 0;
        this.lastExternalCheckTime = now;
        
        const timeDiff = now - lastCheck;
        
        // 如果距离上次检查很短时间（小于200ms），可能是批量操作
        if (timeDiff < 200 && timeDiff > 0) {
            console.log(`检测到快速连续操作，判断为外部工具: ${changeType}`);
            return true;
        }
        
        // 对于单独的文件创建或修改，也认为可能是外部工具操作
        // 因为用户手动操作通常会先触发文档事件，然后是文件系统事件
        return true;
    }

    public markAsExternalOperation(): void {
        // 提供一个公共方法来标记即将进行的外部操作
        this.lastExternalCheckTime = Date.now();
        console.log('标记即将进行外部工具操作');
    }

    private onDocumentSaved(document: vscode.TextDocument): void {
        // 检查文件是否应该被跟踪
        if (!this.gitIgnoreManager.shouldTrackFile(document.uri.fsPath)) {
            console.log(`跳过被忽略的文件: ${document.uri.fsPath}`);
            return;
        }

        // 检查是否是插件自己在更新时间戳导致的保存
        if (this.isUpdatingTimestamp.has(document.uri.fsPath)) {
            console.log(`跳过时间戳更新导致的文档保存: ${document.uri.fsPath}`);
            
            // 触发 Git 操作（如果启用了自动提交且文件应该被提交）
            const config = this.getWorkspaceConfig();
            if (config.get('enableAutoCommit') && this.gitIgnoreManager.shouldCommitFile(document.uri.fsPath)) {
                this.gitManager.stageFile(document.uri.fsPath);
            }
            return;
        }

        console.log(`用户保存文档: ${document.uri.fsPath}`);
        
        // 标记开始更新时间戳
        this.isUpdatingTimestamp.add(document.uri.fsPath);

        try {
            // 更新文件时间戳并添加/更新注释（用户主动保存才更新注释）
            this.timestampProvider.addTimestamp(document.uri);
            
            // 记录保存事件
            this.timestampProvider.updateFileChange(document.uri.fsPath, '文档保存');

            // 触发 Git 操作（如果启用了自动提交且文件应该被提交）
            const config = this.getWorkspaceConfig();
            if (config.get('enableAutoCommit') && this.gitIgnoreManager.shouldCommitFile(document.uri.fsPath)) {
                this.gitManager.stageFile(document.uri.fsPath);
            }
        } finally {
            // 延迟清除标记
            setTimeout(() => {
                this.isUpdatingTimestamp.delete(document.uri.fsPath);
            }, 1000);
        }
    }

    private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
        if (event.contentChanges.length === 0) {
            return;
        }

        const document = event.document;
        
        // 检查文件是否应该被跟踪
        if (!this.gitIgnoreManager.shouldTrackFile(document.uri.fsPath)) {
            return;
        }

        // 检查是否是插件自己在更新时间戳
        if (this.isUpdatingTimestamp.has(document.uri.fsPath)) {
            return;
        }
        
        // 分析变更内容
        const changes = event.contentChanges;
        let changeDescription = '';

        for (const change of changes) {
            if (change.text.length > change.rangeLength) {
                changeDescription += '添加内容 ';
            } else if (change.text.length < change.rangeLength) {
                changeDescription += '删除内容 ';
            } else {
                changeDescription += '修改内容 ';
            }
        }

        if (changeDescription) {
            this.timestampProvider.updateFileChange(
                document.uri.fsPath, 
                changeDescription.trim()
            );
        }
    }

    dispose(): void {
        // 清理所有定时器
        this.timestampUpdateTimeout.forEach(timeout => clearTimeout(timeout));
        this.timestampUpdateTimeout.clear();
        
        // 清理集合
        this.isUpdatingTimestamp.clear();
        
        // 清理监听器
        this.disposables.forEach(d => d.dispose());
        this.watchers.forEach(w => w.dispose());
    }
}