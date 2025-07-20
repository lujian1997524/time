/**
 * 最后修改时间: 2025-07-20 09:49:55
 * 上次修改时间: 2025-07-20 09:44:16
 * 文件大小: 21536 bytes
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
        
        // 分析代码变化的具体内容
        const changeAnalysis = await this.analyzeCodeChanges(status.files);
        
        if (changeAnalysis.features.length > 0 || changeAnalysis.fixes.length > 0 || changeAnalysis.improvements.length > 0) {
            // 生成基于功能的提交信息
            return this.generateFeatureBasedCommitMessage(changeAnalysis, timestamp);
        } else {
            // 如果无法分析出具体功能，使用文件变化分析
            return this.generateFileBasedCommitMessage(status, timestamp);
        }
    }

    private async analyzeCodeChanges(files: any[]): Promise<any> {
        const analysis = {
            features: [] as string[],
            fixes: [] as string[],
            improvements: [] as string[],
            configs: [] as string[],
            docs: [] as string[]
        };

        for (const file of files) {
            try {
                // 读取文件内容来分析变化
                const filePath = path.join(this.workspaceRoot, file.path);
                const content = require('fs').readFileSync(filePath, 'utf8');
                
                // 分析文件名和内容
                const fileName = path.basename(file.path).toLowerCase();
                const fileAnalysis = this.analyzeFileContent(fileName, content, file.path);
                
                analysis.features.push(...fileAnalysis.features);
                analysis.fixes.push(...fileAnalysis.fixes);
                analysis.improvements.push(...fileAnalysis.improvements);
                analysis.configs.push(...fileAnalysis.configs);
                analysis.docs.push(...fileAnalysis.docs);
                
            } catch (error) {
                console.log(`无法分析文件 ${file.path}: ${error}`);
            }
        }
        
        // 去重
        analysis.features = [...new Set(analysis.features)];
        analysis.fixes = [...new Set(analysis.fixes)];
        analysis.improvements = [...new Set(analysis.improvements)];
        analysis.configs = [...new Set(analysis.configs)];
        analysis.docs = [...new Set(analysis.docs)];
        
        return analysis;
    }

    private analyzeFileContent(fileName: string, content: string, filePath: string): any {
        const analysis = {
            features: [] as string[],
            fixes: [] as string[],
            improvements: [] as string[],
            configs: [] as string[],
            docs: [] as string[]
        };

        // 转换为小写便于匹配
        const lowerContent = content.toLowerCase();
        const lowerFileName = fileName.toLowerCase();

        // 分析新功能
        if (this.detectNewFeature(lowerContent, lowerFileName, filePath)) {
            const feature = this.extractFeatureDescription(content, fileName);
            if (feature) analysis.features.push(feature);
        }

        // 分析错误修复
        if (this.detectBugFix(lowerContent, lowerFileName)) {
            const fix = this.extractFixDescription(content, fileName);
            if (fix) analysis.fixes.push(fix);
        }

        // 分析改进
        if (this.detectImprovement(lowerContent, lowerFileName)) {
            const improvement = this.extractImprovementDescription(content, fileName);
            if (improvement) analysis.improvements.push(improvement);
        }

        // 分析配置变化
        if (this.detectConfigChange(lowerFileName, lowerContent)) {
            const config = this.extractConfigDescription(fileName, content);
            if (config) analysis.configs.push(config);
        }

        // 分析文档更新
        if (this.detectDocumentationChange(lowerFileName, lowerContent)) {
            const doc = this.extractDocDescription(fileName, content);
            if (doc) analysis.docs.push(doc);
        }

        return analysis;
    }

    private detectNewFeature(content: string, fileName: string, filePath: string): boolean {
        // 检测新功能的关键词和模式
        const featureKeywords = [
            'export class', 'export function', 'export interface',
            'new ', '新增', '添加', 'add', 'create', 'implement',
            'feature', '功能', 'method', 'component'
        ];

        const hasNewCode = featureKeywords.some(keyword => content.includes(keyword));
        const isNewFile = filePath.includes('new') || content.includes('新建') || content.includes('创建');
        
        return hasNewCode || isNewFile;
    }

    private detectBugFix(content: string, fileName: string): boolean {
        // 检测错误修复的关键词
        const fixKeywords = [
            'fix', 'bug', 'error', 'issue', 'problem',
            '修复', '错误', '问题', '解决', 'solve',
            'correct', '纠正', 'patch', '补丁'
        ];

        return fixKeywords.some(keyword => content.includes(keyword));
    }

    private detectImprovement(content: string, fileName: string): boolean {
        // 检测改进的关键词
        const improvementKeywords = [
            'improve', 'optimize', 'enhance', 'refactor',
            '改进', '优化', '增强', '重构', '提升',
            'performance', '性能', 'better', '更好'
        ];

        return improvementKeywords.some(keyword => content.includes(keyword));
    }

    private detectConfigChange(fileName: string, content: string): boolean {
        // 检测配置文件变化
        const configFiles = ['package.json', 'tsconfig.json', '.json', '.yaml', '.yml', '.env'];
        return configFiles.some(ext => fileName.includes(ext));
    }

    private detectDocumentationChange(fileName: string, content: string): boolean {
        // 检测文档变化
        const docFiles = ['.md', 'readme', 'doc', 'manual'];
        return docFiles.some(ext => fileName.includes(ext));
    }

    private extractFeatureDescription(content: string, fileName: string): string {
        // 从注释或函数名中提取功能描述
        const lines = content.split('\n');
        
        // 查找包含功能描述的注释
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('//') && (line.includes('新增') || line.includes('添加') || line.includes('功能'))) {
                return this.cleanDescription(line);
            }
            if (line.includes('/**') && i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine.includes('新增') || nextLine.includes('添加') || nextLine.includes('功能')) {
                    return this.cleanDescription(nextLine);
                }
            }
        }

        // 从文件名推断功能
        if (fileName.includes('test')) return `添加${fileName.replace(/\..*/, '')}测试功能`;
        if (fileName.includes('manager')) return `实现${fileName.replace(/\..*/, '')}管理功能`;
        if (fileName.includes('provider')) return `新增${fileName.replace(/\..*/, '')}数据提供功能`;
        
        return `新增${fileName.replace(/\..*/, '')}功能模块`;
    }

    private extractFixDescription(content: string, fileName: string): string {
        // 提取修复描述
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if ((trimmed.includes('//') || trimmed.includes('*')) && 
                (trimmed.includes('修复') || trimmed.includes('fix') || trimmed.includes('解决'))) {
                return this.cleanDescription(trimmed);
            }
        }

        return `修复${fileName.replace(/\..*/, '')}相关问题`;
    }

    private extractImprovementDescription(content: string, fileName: string): string {
        // 提取改进描述
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if ((trimmed.includes('//') || trimmed.includes('*')) && 
                (trimmed.includes('改进') || trimmed.includes('优化') || trimmed.includes('improve'))) {
                return this.cleanDescription(trimmed);
            }
        }

        return `优化${fileName.replace(/\..*/, '')}性能和功能`;
    }

    private extractConfigDescription(fileName: string, content: string): string {
        if (fileName.includes('package.json')) {
            if (content.includes('"version"')) return '更新项目版本配置';
            if (content.includes('"dependencies"')) return '更新项目依赖配置';
            return '更新项目配置';
        }
        if (fileName.includes('tsconfig.json')) return '更新TypeScript编译配置';
        return `更新${fileName}配置文件`;
    }

    private extractDocDescription(fileName: string, content: string): string {
        if (fileName.includes('readme')) return '更新项目文档和说明';
        if (fileName.includes('doc')) return '更新技术文档';
        return `更新${fileName}文档`;
    }

    private cleanDescription(description: string): string {
        // 清理描述文本，移除注释符号和多余空格
        return description
            .replace(/\/\*\*?|\*\/|\*|\/\/|#/g, '')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\s+/g, ' ');
    }

    private generateFeatureBasedCommitMessage(analysis: any, timestamp: string): string {
        const parts = [];
        
        // 构建主要描述
        if (analysis.features.length > 0) {
            parts.push(`✨ ${analysis.features.join(', ')}`);
        }
        
        if (analysis.fixes.length > 0) {
            parts.push(`🐛 ${analysis.fixes.join(', ')}`);
        }
        
        if (analysis.improvements.length > 0) {
            parts.push(`⚡ ${analysis.improvements.join(', ')}`);
        }
        
        if (analysis.configs.length > 0) {
            parts.push(`🔧 ${analysis.configs.join(', ')}`);
        }
        
        if (analysis.docs.length > 0) {
            parts.push(`📚 ${analysis.docs.join(', ')}`);
        }

        const mainMessage = parts.length > 0 ? parts[0].replace(/^[✨🐛⚡🔧📚]\s/, '') : `代码更新`;
        const details = parts.length > 1 ? `\n\n${parts.slice(1).join('\n')}` : '';
        
        return `${mainMessage}${details}\n\n🕒 ${timestamp}`;
    }

    private generateFileBasedCommitMessage(status: any, timestamp: string): string {
        // 备用方案：基于文件变化的提交信息
        const changes = {
            created: status.files.filter((f: any) => f.index === 'A' || f.working_dir === 'A'),
            modified: status.files.filter((f: any) => f.index === 'M' || f.working_dir === 'M'),
            deleted: status.files.filter((f: any) => f.index === 'D' || f.working_dir === 'D')
        };

        let summary = '';
        if (changes.created.length > 0) summary += `新增${changes.created.length}个文件`;
        if (changes.modified.length > 0) {
            if (summary) summary += ', ';
            summary += `修改${changes.modified.length}个文件`;
        }
        if (changes.deleted.length > 0) {
            if (summary) summary += ', ';
            summary += `删除${changes.deleted.length}个文件`;
        }

        return `${summary}\n\n🕒 ${timestamp}`;
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