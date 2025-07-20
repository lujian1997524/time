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
        return vscode.workspace.getConfiguration('timestampTracker', workspaceFolder?.uri);
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
        
        // 防抖动：清除之前的定时器
        const existingTimeout = this.timestampUpdateTimeout.get(uri.fsPath);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // 延迟处理文件变化，避免频繁触发
        const timeout = setTimeout(() => {
            this.processFileChange(uri, changeType);
            this.timestampUpdateTimeout.delete(uri.fsPath);
        }, 500); // 500ms 延迟

        this.timestampUpdateTimeout.set(uri.fsPath, timeout);
    }

    private processFileChange(uri: vscode.Uri, changeType: string): void {
        // 标记开始更新时间戳
        this.isUpdatingTimestamp.add(uri.fsPath);

        try {
            // 只更新文件时间戳信息，但不一定更新注释
            this.timestampProvider.updateFileTimestamp(uri);
            
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