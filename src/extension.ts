import * as vscode from 'vscode';
import { TimestampProvider } from './timestampProvider';
import { GitManager } from './gitManager';
import { FileWatcher } from './fileWatcher';

export function activate(context: vscode.ExtensionContext) {
    console.log('Timestamp Tracker 插件已激活');

    // 设置上下文
    vscode.commands.executeCommand('setContext', 'timestampTrackerEnabled', true);

    // 创建时间戳提供器
    const timestampProvider = new TimestampProvider(context);
    
    // 创建 Git 管理器
    const gitManager = new GitManager();
    
    // 创建文件监听器
    const fileWatcher = new FileWatcher(timestampProvider, gitManager);

    // 注册视图
    vscode.window.createTreeView('timestampView', {
        treeDataProvider: timestampProvider,
        showCollapseAll: true
    });

    // 注册命令
    const commands = [
        vscode.commands.registerCommand('timestampTracker.refresh', () => {
            timestampProvider.refresh();
        }),
        
        vscode.commands.registerCommand('timestampTracker.addTimestamp', (uri?: vscode.Uri) => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                timestampProvider.addTimestamp(activeEditor.document.uri);
            }
        }),
        
        vscode.commands.registerCommand('timestampTracker.pushToGit', async () => {
            await gitManager.commitAndPush();
        }),
        
        vscode.commands.registerCommand('timestampTracker.settings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'timestampTracker');
        })
    ];

    // 将所有注册项添加到上下文
    context.subscriptions.push(...commands, fileWatcher);

    // 初始化Git仓库并启动自动提交定时器
    gitManager.initializeRepository().then(() => {
        gitManager.startAutoCommit();
    });
}

export function deactivate() {
    console.log('Timestamp Tracker 插件已停用');
}