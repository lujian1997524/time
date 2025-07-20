import * as vscode from 'vscode';
import { simpleGit } from 'simple-git';
import * as path from 'path';
import * as moment from 'moment';

export class GitManager {
    private git: any;
    private autoCommitTimer?: NodeJS.Timeout;
    private stagedFiles: Set<string> = new Set();
    private workspaceRoot: string;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        if (this.workspaceRoot) {
            this.git = simpleGit(this.workspaceRoot);
        }
    }

    private getWorkspaceConfig(): vscode.WorkspaceConfiguration {
        // 获取当前工作区的配置，如果有多个工作区文件夹，使用第一个
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        return vscode.workspace.getConfiguration('timestampTracker', workspaceFolder?.uri);
    }

    public async initializeRepository(): Promise<void> {
        if (!this.git) {
            vscode.window.showErrorMessage('请先打开一个工作区');
            return;
        }

        try {
            const isRepo = await this.git.checkIsRepo();
            if (!isRepo) {
                await this.git.init();
                vscode.window.showInformationMessage('Git 仓库已初始化');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Git 初始化失败: ${error}`);
        }
    }

    public async stageFile(filePath: string): Promise<void> {
        if (!this.git) {
            return;
        }

        try {
            const relativePath = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, filePath);
            await this.git.add(relativePath);
            this.stagedFiles.add(relativePath);
            console.log(`文件已暂存: ${relativePath}`);
        } catch (error) {
            console.error(`暂存文件失败: ${error}`);
        }
    }

    public async commitChanges(message?: string): Promise<void> {
        if (!this.git) {
            vscode.window.showErrorMessage('Git 未初始化');
            return;
        }

        try {
            const status = await this.git.status();
            if (status.files.length === 0) {
                vscode.window.showInformationMessage('没有文件需要提交');
                return;
            }

            const commitMessage = message || `自动提交 - ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
            
            // 暂存所有修改的文件
            await this.git.add('.');
            
            // 提交
            const result = await this.git.commit(commitMessage);
            
            vscode.window.showInformationMessage(`提交成功: ${result.commit}`);
            this.stagedFiles.clear();
            
        } catch (error) {
            vscode.window.showErrorMessage(`提交失败: ${error}`);
        }
    }

    public async pushToRemote(): Promise<void> {
        if (!this.git) {
            vscode.window.showErrorMessage('Git 未初始化');
            return;
        }

        try {
            const config = this.getWorkspaceConfig();
            let repository = config.get<string>('gitRepository');
            
            // 如果没有配置仓库地址，尝试使用当前工作区的远程仓库
            if (!repository) {
                const remotes = await this.git.getRemotes(true);
                if (remotes.length > 0) {
                    // 优先使用 origin，如果没有则使用第一个远程仓库
                    const origin = remotes.find((remote: any) => remote.name === 'origin');
                    const targetRemote = origin || remotes[0];
                    repository = targetRemote.refs.push;
                    console.log(`使用现有远程仓库: ${targetRemote.name} -> ${repository}`);
                }
            }

            if (!repository) {
                vscode.window.showErrorMessage('请在工作区设置中配置 Git 仓库地址，或确保当前工作区已连接到远程仓库');
                return;
            }

            // 检查是否已有远程仓库配置
            const remotes = await this.git.getRemotes(true);
            const hasOrigin = remotes.some((remote: any) => remote.name === 'origin');
            
            if (!hasOrigin) {
                await this.git.addRemote('origin', repository);
                console.log(`添加远程仓库: ${repository}`);
            }

            // 推送到远程仓库
            await this.git.push('origin', 'main');
            vscode.window.showInformationMessage(`推送到远程仓库成功: ${repository}`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`推送失败: ${error}`);
        }
    }

    public async commitAndPush(): Promise<void> {
        await this.commitChanges();
        await this.pushToRemote();
    }

    public startAutoCommit(): void {
        const config = this.getWorkspaceConfig();
        const enabled = config.get<boolean>('enableAutoCommit');
        const interval = config.get<number>('autoCommitInterval', 300) * 1000; // 转换为毫秒

        console.log(`自动提交配置 - 启用: ${enabled}, 间隔: ${interval / 1000} 秒`);

        if (!enabled) {
            console.log('自动提交已禁用');
            return;
        }

        this.stopAutoCommit();

        this.autoCommitTimer = setInterval(async () => {
            try {
                // 检查是否有文件需要提交（不只是已暂存的文件）
                const status = await this.getStatus();
                if (status && status.files.length > 0) {
                    console.log(`发现 ${status.files.length} 个文件有变更，执行自动提交...`);
                    await this.commitAndPush();
                }
            } catch (error) {
                console.error('自动提交失败:', error);
            }
        }, interval);

        console.log(`自动提交已启动，间隔: ${interval / 1000} 秒`);
    }

    public stopAutoCommit(): void {
        if (this.autoCommitTimer) {
            clearInterval(this.autoCommitTimer);
            this.autoCommitTimer = undefined;
            console.log('自动提交已停止');
        }
    }

    public async getStatus(): Promise<any> {
        if (!this.git) {
            return null;
        }

        try {
            return await this.git.status();
        } catch (error) {
            console.error('获取 Git 状态失败:', error);
            return null;
        }
    }

    public async getBranch(): Promise<string> {
        if (!this.git) {
            return 'unknown';
        }

        try {
            const status = await this.git.status();
            return status.current || 'unknown';
        } catch (error) {
            console.error('获取分支失败:', error);
            return 'unknown';
        }
    }

    public async getLastCommit(): Promise<any> {
        if (!this.git) {
            return null;
        }

        try {
            const log = await this.git.log({ maxCount: 1 });
            return log.latest;
        } catch (error) {
            console.error('获取最后提交失败:', error);
            return null;
        }
    }
}