/**
 * 最后修改时间: 2025-07-20 09:44:15
 * 上次修改时间: 2025-07-20 09:02:20
 * 文件大小: 13771 bytes
 */
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
        const config = vscode.workspace.getConfiguration('timestampTracker', workspaceFolder?.uri);
        
        // 调试日志：显示当前工作区信息
        console.log(`当前工作区: ${workspaceFolder?.name || '未知'} (${workspaceFolder?.uri.fsPath || '无路径'})`);
        console.log(`Git仓库配置: ${config.get<string>('gitRepository') || '未设置'}`);
        
        return config;
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

            let commitMessage: string;
            if (message) {
                commitMessage = message;
            } else {
                // 生成详细的提交信息
                commitMessage = await this.generateDetailedCommitMessage(status);
            }
            
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

    private async generateDetailedCommitMessage(status: any): Promise<string> {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        
        // 分类文件变化
        const changes = {
            created: status.files.filter((f: any) => f.index === 'A' || f.working_dir === 'A'),
            modified: status.files.filter((f: any) => f.index === 'M' || f.working_dir === 'M'),
            deleted: status.files.filter((f: any) => f.index === 'D' || f.working_dir === 'D'),
            renamed: status.files.filter((f: any) => f.index === 'R' || f.working_dir === 'R')
        };

        let summary = '';
        const details = [];

        // 生成概述
        if (changes.created.length > 0) {
            summary += `新增${changes.created.length}个文件`;
            details.push(`📝 新增文件: ${changes.created.map((f: any) => path.basename(f.path)).join(', ')}`);
        }
        
        if (changes.modified.length > 0) {
            if (summary) summary += ', ';
            summary += `修改${changes.modified.length}个文件`;
            details.push(`✏️ 修改文件: ${changes.modified.map((f: any) => path.basename(f.path)).join(', ')}`);
        }
        
        if (changes.deleted.length > 0) {
            if (summary) summary += ', ';
            summary += `删除${changes.deleted.length}个文件`;
            details.push(`🗑️ 删除文件: ${changes.deleted.map((f: any) => path.basename(f.path)).join(', ')}`);
        }
        
        if (changes.renamed.length > 0) {
            if (summary) summary += ', ';
            summary += `重命名${changes.renamed.length}个文件`;
            details.push(`📝 重命名文件: ${changes.renamed.map((f: any) => path.basename(f.path)).join(', ')}`);
        }

        // 检测文件类型和特殊操作
        const typeAnalysis = this.analyzeFileTypes(status.files);
        if (typeAnalysis.length > 0) {
            details.push(`🔧 涉及: ${typeAnalysis.join(', ')}`);
        }

        // 构建最终提交信息
        const commitMessage = `${summary} - ${timestamp}

${details.join('\n')}

📊 变更统计: ${status.files.length}个文件
🕒 自动提交时间: ${timestamp}`;

        console.log('生成的提交信息:', commitMessage);
        return commitMessage;
    }

    private analyzeFileTypes(files: any[]): string[] {
        const analysis = [];
        const extensions = new Set(files.map((f: any) => path.extname(f.path).toLowerCase()));
        
        // 检测文件类型
        if (extensions.has('.ts') || extensions.has('.js')) {
            analysis.push('TypeScript/JavaScript代码');
        }
        if (extensions.has('.json')) {
            analysis.push('配置文件');
        }
        if (extensions.has('.md')) {
            analysis.push('文档更新');
        }
        if (extensions.has('.css') || extensions.has('.scss')) {
            analysis.push('样式文件');
        }
        if (extensions.has('.html')) {
            analysis.push('页面文件');
        }
        
        // 检测特殊文件
        const specialFiles = files.filter((f: any) => {
            const fileName = path.basename(f.path).toLowerCase();
            return fileName.includes('package.json') || 
                   fileName.includes('tsconfig.json') || 
                   fileName.includes('readme') ||
                   fileName.includes('license');
        });
        
        if (specialFiles.length > 0) {
            analysis.push('项目配置');
        }
        
        // 检测时间戳更新
        const hasTimestampFiles = files.some((f: any) => 
            f.path.includes('timestamp') || 
            f.path.includes('时间戳')
        );
        
        if (hasTimestampFiles) {
            analysis.push('时间戳跟踪');
        }
        
        return analysis;
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

    public async forceCommitAndPush(): Promise<void> {
        await this.commitChanges();
        await this.forcePushToRemote();
    }

    public async forcePushToRemote(): Promise<void> {
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

            // 强制推送到远程仓库，覆盖远程分支
            await this.git.push('origin', 'main', ['--force']);
            vscode.window.showInformationMessage(`强制推送成功，已覆盖远程仓库: ${repository}`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`强制推送失败: ${error}`);
        }
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