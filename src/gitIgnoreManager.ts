import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class GitIgnoreManager {
    private ignorePatterns: string[] = [];
    private workspaceRoot: string;
    private gitignorePath: string;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.gitignorePath = path.join(this.workspaceRoot, '.gitignore');
        this.loadGitIgnore();
        this.watchGitIgnore();
    }

    private loadGitIgnore(): void {
        try {
            if (fs.existsSync(this.gitignorePath)) {
                const content = fs.readFileSync(this.gitignorePath, 'utf8');
                this.parseGitIgnore(content);
                console.log(`已加载 .gitignore 规则: ${this.ignorePatterns.length} 条`);
            } else {
                console.log('.gitignore 文件不存在，使用默认忽略规则');
                this.setDefaultIgnorePatterns();
            }
        } catch (error) {
            console.error('加载 .gitignore 失败:', error);
            this.setDefaultIgnorePatterns();
        }
    }

    private parseGitIgnore(content: string): void {
        this.ignorePatterns = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // 跳过空行和注释
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            
            this.ignorePatterns.push(trimmed);
        }

        // 添加默认的忽略模式
        this.addDefaultPatterns();
    }

    private setDefaultIgnorePatterns(): void {
        this.ignorePatterns = [
            'node_modules/**',
            '.git/**',
            '*.log',
            '.DS_Store',
            'Thumbs.db',
            '*.tmp',
            '*.temp',
            '.vscode/**',
            'out/**',
            'dist/**',
            'build/**',
            '*.vsix'
        ];
    }

    private addDefaultPatterns(): void {
        const defaultPatterns = [
            '**/.git/**',
            '**/node_modules/**',
            '**/.vscode/**',
            '**/out/**',
            '**/dist/**',
            '**/build/**',
            '**/*.log',
            '**/.DS_Store',
            '**/Thumbs.db'
        ];

        for (const pattern of defaultPatterns) {
            if (!this.ignorePatterns.includes(pattern)) {
                this.ignorePatterns.push(pattern);
            }
        }
    }

    private watchGitIgnore(): void {
        if (fs.existsSync(this.gitignorePath)) {
            const watcher = fs.watchFile(this.gitignorePath, (curr, prev) => {
                console.log('.gitignore 文件已更新，重新加载规则');
                this.loadGitIgnore();
            });
        }
    }

    public isIgnored(filePath: string): boolean {
        const relativePath = path.relative(this.workspaceRoot, filePath);
        
        // 标准化路径分隔符
        const normalizedPath = relativePath.replace(/\\\\/g, '/');
        
        for (const pattern of this.ignorePatterns) {
            if (this.matchPattern(normalizedPath, pattern)) {
                return true;
            }
        }
        
        return false;
    }

    private matchPattern(filePath: string, pattern: string): boolean {
        // 处理否定模式 (以 ! 开头)
        if (pattern.startsWith('!')) {
            return false; // 否定模式暂时跳过，需要特殊处理
        }
        
        // 转换 gitignore 模式为正则表达式
        let regexPattern = pattern
            .replace(/\\\\/g, '/')  // 标准化路径分隔符
            .replace(/\\./g, '\\\\.')  // 转义点号
            .replace(/\\*/g, '[^/]*')  // * 匹配除路径分隔符外的任意字符
            .replace(/\\*\\*/g, '.*')  // ** 匹配任意字符包括路径分隔符
            .replace(/\\?/g, '[^/]'); // ? 匹配单个字符（除路径分隔符）

        // 如果模式以 / 开头，则从根目录匹配
        if (pattern.startsWith('/')) {
            regexPattern = '^' + regexPattern.substring(1);
        } else {
            // 否则可以匹配任意位置
            regexPattern = '(^|/)' + regexPattern;
        }

        // 如果模式以 / 结尾，则只匹配目录
        if (pattern.endsWith('/')) {
            regexPattern += '(/|$)';
        } else {
            regexPattern += '($|/)';
        }

        try {
            const regex = new RegExp(regexPattern);
            const isMatch = regex.test(filePath) || regex.test(path.basename(filePath));
            
            if (isMatch) {
                console.log(`文件 ${filePath} 匹配忽略规则: ${pattern}`);
            }
            
            return isMatch;
        } catch (error) {
            console.warn(`无效的忽略模式: ${pattern}`, error);
            return false;
        }
    }

    public getIgnorePatterns(): string[] {
        return [...this.ignorePatterns];
    }

    public shouldTrackFile(filePath: string): boolean {
        // 检查文件是否应该被跟踪
        return !this.isIgnored(filePath);
    }

    public shouldAddTimestamp(filePath: string): boolean {
        // 检查是否应该为文件添加时间戳注释
        return this.shouldTrackFile(filePath);
    }

    public shouldCommitFile(filePath: string): boolean {
        // 检查文件是否应该被提交到 Git
        return this.shouldTrackFile(filePath);
    }
}