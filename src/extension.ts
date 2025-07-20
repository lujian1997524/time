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
        
        vscode.commands.registerCommand('timestampTracker.forcePushToGit', async () => {
            // 显示确认对话框
            const result = await vscode.window.showWarningMessage(
                '⚠️ 强制推送将覆盖远程仓库的内容，这个操作不可撤销！',
                {
                    modal: true,
                    detail: '这将强制推送本地的所有文件到远程仓库，覆盖远程仓库的所有内容。请确认你要继续。'
                },
                '确认强制推送',
                '取消'
            );
            
            if (result === '确认强制推送') {
                await gitManager.forceCommitAndPush();
            }
        }),
        
        vscode.commands.registerCommand('timestampTracker.settings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'timestampTracker');
        }),

        vscode.commands.registerCommand('timestampTracker.showConfig', () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            const config = vscode.workspace.getConfiguration('timestampTracker', workspaceFolder?.uri);
            
            const configInfo = [
                `工作区: ${workspaceFolder?.name || '未知'}`,
                `路径: ${workspaceFolder?.uri.fsPath || '无路径'}`,
                `Git仓库: ${config.get<string>('gitRepository') || '未设置'}`,
                `自动提交: ${config.get<boolean>('enableAutoCommit') ? '启用' : '禁用'}`,
                `提交间隔: ${config.get<number>('autoCommitInterval', 300)} 秒`,
                `时间戳格式: ${config.get<string>('timestampFormat', 'YYYY-MM-DD HH:mm:ss')}`
            ].join('\n');

            vscode.window.showInformationMessage(
                `当前工作区配置:\n\n${configInfo}`,
                { modal: true }
            );
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