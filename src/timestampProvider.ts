/**
 * 最后修改时间: 2025-07-20 10:12:03
 * 上次修改时间: 2025-07-20 10:11:14
 * 文件大小: 26516 bytes
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
import { GitIgnoreManager } from './gitIgnoreManager';
import { CommentManager } from './commentManager';

export interface FileTimestamp {
    filePath: string;
    fileName: string;
    lastModified: Date;
    previousModified?: Date;
    changes: string[];
    size: number;
}

export class TimestampProvider implements vscode.TreeDataProvider<FileTimestamp> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileTimestamp | undefined | null | void> = new vscode.EventEmitter<FileTimestamp | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileTimestamp | undefined | null | void> = this._onDidChangeTreeData.event;

    private fileTimestamps: Map<string, FileTimestamp> = new Map();
    private workspaceRoot: string;
    private gitIgnoreManager: GitIgnoreManager;
    private commentManager: CommentManager;

    constructor(private context: vscode.ExtensionContext) {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.gitIgnoreManager = new GitIgnoreManager();
        this.commentManager = new CommentManager();
        this.loadTimestamps();
    }

    refresh(): void {
        this.loadTimestamps();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileTimestamp): vscode.TreeItem {
        const item = new vscode.TreeItem(
            element.fileName,
            vscode.TreeItemCollapsibleState.None
        );
        
        item.description = moment(element.lastModified).format('MM-DD HH:mm');
        item.tooltip = `文件: ${element.filePath}\n最后修改: ${moment(element.lastModified).format('YYYY-MM-DD HH:mm:ss')}\n大小: ${element.size} bytes`;
        
        if (element.previousModified) {
            item.tooltip += `\n上次修改: ${moment(element.previousModified).format('YYYY-MM-DD HH:mm:ss')}`;
        }
        
        if (element.changes.length > 0) {
            item.tooltip += `\n修改内容: ${element.changes.join(', ')}`;
        }

        item.command = {
            command: 'vscode.open',
            title: '打开文件',
            arguments: [vscode.Uri.file(element.filePath)]
        };

        // 根据文件类型设置图标
        const ext = path.extname(element.fileName);
        switch (ext) {
            case '.js':
            case '.ts':
                item.iconPath = new vscode.ThemeIcon('symbol-method');
                break;
            case '.json':
                item.iconPath = new vscode.ThemeIcon('json');
                break;
            case '.md':
                item.iconPath = new vscode.ThemeIcon('markdown');
                break;
            default:
                item.iconPath = new vscode.ThemeIcon('file');
        }

        return item;
    }

    getChildren(element?: FileTimestamp): Thenable<FileTimestamp[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('请打开一个工作区');
            return Promise.resolve([]);
        }

        if (!element) {
            // 返回根级别的文件
            return Promise.resolve(Array.from(this.fileTimestamps.values()).sort((a, b) => 
                b.lastModified.getTime() - a.lastModified.getTime()
            ));
        }

        return Promise.resolve([]);
    }

    private loadTimestamps(): void {
        if (!this.workspaceRoot) {
            return;
        }

        // 递归扫描工作区文件
        this.scanDirectory(this.workspaceRoot);
    }

    private scanDirectory(dirPath: string): void {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                
                // 使用 GitIgnoreManager 检查是否应该忽略
                if (this.gitIgnoreManager.isIgnored(fullPath)) {
                    continue;
                }
                
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    this.scanDirectory(fullPath);
                } else if (stats.isFile()) {
                    this.addFileTimestamp(fullPath, stats);
                }
            }
        } catch (error) {
            console.error('扫描目录失败:', error);
        }
    }

    private addFileTimestamp(filePath: string, stats: fs.Stats): void {
        const existing = this.fileTimestamps.get(filePath);
        const fileName = path.basename(filePath);
        
        const fileTimestamp: FileTimestamp = {
            filePath,
            fileName,
            lastModified: stats.mtime,
            previousModified: existing?.lastModified,
            changes: existing?.changes || [],
            size: stats.size
        };

        this.fileTimestamps.set(filePath, fileTimestamp);
    }

    public updateFileTimestamp(uri: vscode.Uri): void {
        // 检查文件是否应该被跟踪
        if (!this.gitIgnoreManager.shouldTrackFile(uri.fsPath)) {
            console.log(`跳过被忽略的文件: ${uri.fsPath}`);
            return;
        }

        try {
            const stats = fs.statSync(uri.fsPath);
            this.addFileTimestamp(uri.fsPath, stats);
            
            // 只更新时间戳信息，不更新注释
            console.log(`更新文件时间戳信息: ${path.basename(uri.fsPath)}`);
        } catch (error) {
            console.error(`更新文件时间戳失败: ${error}`);
        }
    }

    public addTimestampWithActualTime(uri: vscode.Uri, actualFileModTime: Date): void {
        console.log(`addTimestampWithActualTime 被调用，文件: ${uri.fsPath}`);
        console.log(`实际文件修改时间: ${actualFileModTime.toISOString()}`);
        
        // 检查文件是否应该被跟踪
        if (!this.gitIgnoreManager.shouldAddTimestamp(uri.fsPath)) {
            console.log(`跳过被忽略的文件: ${uri.fsPath}`);
            return;
        }

        try {
            // 获取当前文件信息，包括之前的时间戳
            const existingFileInfo = this.fileTimestamps.get(uri.fsPath);
            const previousModifiedTime = existingFileInfo?.lastModified;
            
            // 获取当前文件状态（用于文件大小）
            const stats = fs.statSync(uri.fsPath);
            
            // 手动创建文件时间戳信息，使用传入的实际修改时间
            const fileTimestamp: FileTimestamp = {
                filePath: uri.fsPath,
                fileName: path.basename(uri.fsPath),
                lastModified: actualFileModTime, // 使用传入的实际时间
                previousModified: previousModifiedTime, // 保存之前的时间
                changes: existingFileInfo?.changes || [],
                size: stats.size
            };
            
            this.fileTimestamps.set(uri.fsPath, fileTimestamp);
            
            // 只为支持的文件类型更新时间戳注释
            if (this.commentManager.isCommentSupported(uri.fsPath)) {
                console.log(`文件支持注释，正在更新时间戳注释: ${uri.fsPath}`);
                console.log(`当前时间: ${actualFileModTime.toISOString()}`);
                console.log(`上次时间: ${previousModifiedTime ? previousModifiedTime.toISOString() : '无'}`);
                
                // 传递正确的时间：实际文件修改时间和之前保存的时间
                await this.updateTimestampCommentWithTimes(uri, actualFileModTime, previousModifiedTime, stats.size);
            } else {
                console.log(`文件类型不支持注释: ${uri.fsPath}`);
            }
            
            this._onDidChangeTreeData.fire();
            vscode.window.showInformationMessage(`已更新文件时间戳: ${path.basename(uri.fsPath)}`);
        } catch (error) {
            console.error(`添加时间戳失败: ${error}`);
            vscode.window.showErrorMessage(`添加时间戳失败: ${error}`);
        }
    }

    public addTimestamp(uri: vscode.Uri): void {
        console.log(`addTimestamp 被调用，文件: ${uri.fsPath}`);
        
        // 检查文件是否应该被跟踪
        if (!this.gitIgnoreManager.shouldAddTimestamp(uri.fsPath)) {
            console.log(`跳过被忽略的文件: ${uri.fsPath}`);
            return;
        }

        try {
            // 获取当前文件信息，包括之前的时间戳
            const existingFileInfo = this.fileTimestamps.get(uri.fsPath);
            const previousModifiedTime = existingFileInfo?.lastModified;
            
            // 获取当前文件状态（这个mtime已经是更新后的时间）
            const stats = fs.statSync(uri.fsPath);
            const currentModifiedTime = stats.mtime;
            
            // 更新内存中的文件时间戳信息
            this.addFileTimestamp(uri.fsPath, stats);
            
            // 只为支持的文件类型更新时间戳注释
            if (this.commentManager.isCommentSupported(uri.fsPath)) {
                console.log(`文件支持注释，正在更新时间戳注释: ${uri.fsPath}`);
                console.log(`当前时间: ${currentModifiedTime.toISOString()}`);
                console.log(`上次时间: ${previousModifiedTime ? previousModifiedTime.toISOString() : '无'}`);
                
                // 传递正确的时间：当前时间和之前保存的时间
                await this.updateTimestampCommentWithTimes(uri, currentModifiedTime, previousModifiedTime, stats.size);
            } else {
                console.log(`文件类型不支持注释: ${uri.fsPath}`);
            }
            
            this._onDidChangeTreeData.fire();
            vscode.window.showInformationMessage(`已更新文件时间戳: ${path.basename(uri.fsPath)}`);
        } catch (error) {
            console.error(`添加时间戳失败: ${error}`);
            vscode.window.showErrorMessage(`添加时间戳失败: ${error}`);
        }
    }

    public async updateTimestampComment(uri: vscode.Uri): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const edit = new vscode.WorkspaceEdit();
            
            // 获取文件信息
            const fileInfo = this.fileTimestamps.get(uri.fsPath);
            if (!fileInfo) {
                console.log(`文件信息不存在: ${uri.fsPath}`);
                return;
            }

            // 生成新的时间戳注释
            const newComment = this.commentManager.generateTimestampComment(
                uri.fsPath,
                fileInfo.lastModified,
                fileInfo.previousModified,
                fileInfo.size
            );

            if (!newComment) {
                console.log(`无法为文件生成时间戳注释: ${uri.fsPath}`);
                return;
            }

            // 1. 删除所有现有的时间戳注释块
            await this.removeAllTimestampComments(document, edit);
            
            // 2. 在文件开头插入新的时间戳注释
            edit.insert(uri, new vscode.Position(0, 0), newComment + '\n');
            
            // 应用编辑
            await vscode.workspace.applyEdit(edit);
            console.log(`时间戳注释已更新: ${uri.fsPath}`);
            
        } catch (error) {
            console.error('更新时间戳注释失败:', error);
        }
    }

    public async updateTimestampCommentWithTimes(uri: vscode.Uri, lastModified: Date, previousModified?: Date, fileSize?: number): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            
            // 生成新的时间戳注释
            const newComment = this.commentManager.generateTimestampComment(
                uri.fsPath,
                lastModified,
                previousModified,
                fileSize
            );

            if (!newComment) {
                console.log(`无法为文件生成时间戳注释: ${uri.fsPath}`);
                return;
            }

            // 读取文件内容
            let fileContent = document.getText();
            console.log(`原始文件内容行数: ${fileContent.split('\n').length}`);
            
            // 删除所有现有的时间戳注释
            fileContent = this.removeTimestampCommentsFromContent(fileContent, uri.fsPath);
            console.log(`清理后文件内容行数: ${fileContent.split('\n').length}`);
            
            // 在文件开头添加新的时间戳注释
            fileContent = newComment + '\n' + fileContent;
            
            // 创建工作区编辑，替换整个文件内容
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
                new vscode.Position(0, 0),
                new vscode.Position(document.lineCount, 0)
            );
            edit.replace(uri, fullRange, fileContent);
            
            // 应用编辑
            await vscode.workspace.applyEdit(edit);
            
            // 等待一点时间确保编辑完成
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 保存文件
            const doc = await vscode.workspace.openTextDocument(uri);
            await doc.save();
            
            console.log(`时间戳注释已更新（带时间）: ${uri.fsPath}`);
            
        } catch (error) {
            console.error('更新时间戳注释失败:', error);
        }
    }

    private removeTimestampCommentsFromContent(content: string, filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        
        // 使用更简单的字符串匹配方法删除时间戳注释
        // 这种方法更可靠，不依赖复杂的正则表达式
        
        let cleanContent = content;
        
        // 定义时间戳关键词
        const timestampKeywords = ['最后修改时间', '上次修改时间', '文件大小', 'Last modified', 'Modified', 'File size'];
        
        if (ext === '.md' || ext === '.html' || ext === '.xml') {
            // HTML/XML/Markdown 注释格式: <!-- ... -->
            cleanContent = this.removeHtmlComments(cleanContent, timestampKeywords);
        } else if (ext === '.py') {
            // Python 注释格式: """ ... """
            cleanContent = this.removePythonComments(cleanContent, timestampKeywords);
        } else if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx' || 
                   ext === '.java' || ext === '.c' || ext === '.cpp' || ext === '.cs' ||
                   ext === '.swift' || ext === '.kt' || ext === '.dart' || ext === '.scala') {
            // JavaScript/TypeScript/Java/C++ 等注释格式: /** ... */ 或 /* ... */
            cleanContent = this.removeJavaScriptComments(cleanContent, timestampKeywords);
        } else if (ext === '.sh' || ext === '.bash' || ext === '.zsh' || ext === '.yml' || 
                   ext === '.yaml' || ext === '.toml' || ext === '.py' || ext === '.rb' || 
                   ext === '.pl' || ext === '.r') {
            // Shell/YAML/Python/Ruby 等注释格式: # ...
            cleanContent = this.removeHashComments(cleanContent, timestampKeywords);
        }
        
        console.log(`清理前行数: ${content.split('\n').length}, 清理后行数: ${cleanContent.split('\n').length}`);
        
        return cleanContent;
    }

    private removeHtmlComments(content: string, keywords: string[]): string {
        const lines = content.split('\n');
        const resultLines: string[] = [];
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            
            // 检查是否是HTML注释开始
            if (line.includes('<!--')) {
                // 收集整个注释块内容来检查是否包含时间戳关键词
                let commentContent = '';
                let commentStartIndex = i;
                let endFound = false;
                
                // 读取整个注释块
                while (i < lines.length && !endFound) {
                    commentContent += lines[i] + '\n';
                    if (lines[i].includes('-->')) {
                        endFound = true;
                    }
                    i++;
                }
                
                // 检查注释块是否包含时间戳关键词
                const containsTimestamp = keywords.some(keyword => commentContent.includes(keyword));
                
                if (containsTimestamp) {
                    console.log(`删除HTML时间戳注释块，行 ${commentStartIndex}-${i-1}`);
                    // 跳过空行
                    while (i < lines.length && lines[i].trim() === '') {
                        i++;
                    }
                } else {
                    // 保留非时间戳注释
                    const commentLines = commentContent.split('\n');
                    commentLines.pop(); // 移除最后的空行
                    resultLines.push(...commentLines);
                }
            } else {
                resultLines.push(line);
                i++;
            }
        }
        
        return resultLines.join('\n');
    }

    private removePythonComments(content: string, keywords: string[]): string {
        const lines = content.split('\n');
        const resultLines: string[] = [];
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            
            // 检查是否是Python多行注释开始且包含时间戳关键词
            if (line.includes('"""') && keywords.some(keyword => content.substring(content.indexOf(line)).includes(keyword))) {
                // 找到注释块的结束
                let endFound = false;
                let quoteCount = (line.match(/"""/g) || []).length;
                
                if (quoteCount >= 2) {
                    // 单行包含开始和结束
                    endFound = true;
                    i++;
                } else {
                    // 多行注释
                    i++;
                    while (i < lines.length && !endFound) {
                        if (lines[i].includes('"""')) {
                            endFound = true;
                        }
                        i++;
                    }
                }
                
                // 跳过空行
                while (i < lines.length && lines[i].trim() === '') {
                    i++;
                }
            } else {
                resultLines.push(line);
                i++;
            }
        }
        
        return resultLines.join('\n');
    }

    private removeJavaScriptComments(content: string, keywords: string[]): string {
        const lines = content.split('\n');
        const resultLines: string[] = [];
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            
            // 检查是否是JavaScript注释开始且包含时间戳关键词
            if ((line.includes('/**') || line.includes('/*')) && keywords.some(keyword => content.substring(content.indexOf(line)).includes(keyword))) {
                // 找到注释块的结束
                let endFound = false;
                
                if (line.includes('*/')) {
                    // 单行注释
                    endFound = true;
                    i++;
                } else {
                    // 多行注释
                    i++;
                    while (i < lines.length && !endFound) {
                        if (lines[i].includes('*/')) {
                            endFound = true;
                        }
                        i++;
                    }
                }
                
                // 跳过空行
                while (i < lines.length && lines[i].trim() === '') {
                    i++;
                }
            } else {
                resultLines.push(line);
                i++;
            }
        }
        
        return resultLines.join('\n');
    }

    private removeHashComments(content: string, keywords: string[]): string {
        const lines = content.split('\n');
        const resultLines: string[] = [];
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            
            // 检查是否是#注释且包含时间戳关键词
            if (line.trim().startsWith('#') && keywords.some(keyword => line.includes(keyword))) {
                // 跳过连续的#注释行（时间戳注释块）
                while (i < lines.length && 
                       (lines[i].trim().startsWith('#') || lines[i].trim() === '')) {
                    i++;
                }
            } else {
                resultLines.push(line);
                i++;
            }
        }
        
        return resultLines.join('\n');
    }

    private findContentCommentBlockStart(lines: string[], fromLine: number): number {
        // 从给定行向上查找注释块的开始
        for (let i = fromLine; i >= 0; i--) {
            const trimmed = lines[i].trim();
            
            // 检查是否是注释块的开始标记
            if (trimmed.startsWith('/**') || 
                trimmed.startsWith('/*') ||
                trimmed.startsWith('<!--') ||
                trimmed.startsWith('"""') ||
                trimmed.startsWith('=begin') ||
                trimmed.startsWith('<#') ||
                trimmed.startsWith('--[[')) {
                return i;
            }
            
            // 如果是单行注释的延续，继续向上查找
            if (trimmed.startsWith('//') || 
                trimmed.startsWith('#') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('%') ||
                trimmed.startsWith('"') ||
                trimmed.startsWith(';') ||
                trimmed.startsWith('--')) {
                continue;
            }
            
            // 如果遇到非注释行，停止查找
            if (trimmed.length > 0) {
                return i + 1;
            }
        }
        
        return fromLine;
    }

    private findContentCommentBlockEnd(lines: string[], fromLine: number, ext: string): number {
        // 从给定行向下查找注释块的结束
        for (let i = fromLine; i < Math.min(fromLine + 15, lines.length); i++) {
            const trimmed = lines[i].trim();
            
            // 检查多行注释的结束标记
            if (trimmed.includes('*/') || 
                trimmed.includes('-->') || 
                trimmed.includes('"""') ||
                trimmed.includes('%}') ||
                trimmed.includes('#>') ||
                trimmed.includes('=end') ||
                trimmed.includes(']]') ||
                trimmed.includes('-}')) {
                return i;
            }
            
            // 对于单行注释，检查下一行是否还是注释
            if (i < lines.length - 1) {
                const nextTrimmed = lines[i + 1].trim();
                
                // 如果下一行不是注释或者是空行，当前行就是结束
                if (nextTrimmed.length === 0 || 
                    (!nextTrimmed.startsWith('//') && 
                     !nextTrimmed.startsWith('#') &&
                     !nextTrimmed.startsWith('*') &&
                     !nextTrimmed.startsWith('%') &&
                     !nextTrimmed.startsWith('"') &&
                     !nextTrimmed.startsWith(';') &&
                     !nextTrimmed.startsWith('--'))) {
                    return i;
                }
            }
        }
        
        return fromLine;
    }

    private async removeAllTimestampComments(document: vscode.TextDocument, edit: vscode.WorkspaceEdit): Promise<void> {
        const timestampRegex = this.commentManager.getTimestampRegex(document.uri.fsPath);
        if (!timestampRegex) {
            return;
        }

        const rangesToDelete: vscode.Range[] = [];
        const processedLines = new Set<number>();
        
        // 扫描整个文件的前30行查找所有时间戳注释块
        for (let i = 0; i < Math.min(30, document.lineCount); i++) {
            if (processedLines.has(i)) {
                continue; // 跳过已处理的行
            }
            
            const line = document.lineAt(i);
            
            if (timestampRegex.test(line.text)) {
                // 找到时间戳注释，确定完整的注释块范围
                const blockStart = this.findCommentBlockStart(document, i);
                const blockEnd = this.findCommentBlockEnd(document, i);
                
                // 标记这个范围内的所有行为已处理
                for (let j = blockStart; j <= blockEnd; j++) {
                    processedLines.add(j);
                }
                
                // 创建删除范围（包含换行符）
                const deleteRange = new vscode.Range(
                    new vscode.Position(blockStart, 0),
                    new vscode.Position(Math.min(blockEnd + 1, document.lineCount), 0)
                );
                
                rangesToDelete.push(deleteRange);
                console.log(`标记删除时间戳注释块: 行 ${blockStart}-${blockEnd}`);
            }
        }

        // 按倒序删除（从文件末尾开始），避免行号偏移问题
        rangesToDelete.sort((a, b) => b.start.line - a.start.line);
        
        for (const range of rangesToDelete) {
            edit.delete(document.uri, range);
        }
        
        console.log(`总共删除 ${rangesToDelete.length} 个时间戳注释块`);
    }

    private async hasTimestampComment(document: vscode.TextDocument): Promise<boolean> {
        const timestampRegex = this.commentManager.getTimestampRegex(document.uri.fsPath);
        
        if (!timestampRegex || document.lineCount === 0) {
            return false;
        }

        // 检查文件前10行是否有时间戳注释
        for (let i = 0; i < Math.min(10, document.lineCount); i++) {
            const line = document.lineAt(i);
            if (timestampRegex.test(line.text)) {
                console.log(`检测到时间戳注释在行 ${i}: ${line.text.trim()}`);
                return true;
            }
        }
        
        return false;
    }

    private async updateExistingTimestampComment(uri: vscode.Uri): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();
        
        const fileInfo = this.fileTimestamps.get(uri.fsPath);
        
        // 生成新的时间戳注释
        const comment = this.commentManager.generateTimestampComment(
            uri.fsPath,
            fileInfo?.lastModified || new Date(),
            fileInfo?.previousModified,
            fileInfo?.size
        );

        if (!comment) {
            console.log(`无法为文件生成时间戳注释: ${uri.fsPath}`);
            return;
        }

        // 找到现有的时间戳注释并替换
        const timestampRegex = this.commentManager.getTimestampRegex(uri.fsPath);
        
        if (timestampRegex && document.lineCount > 0) {
            const commentRange = this.findTimestampCommentRange(document, timestampRegex);
            
            if (commentRange) {
                // 替换现有注释
                edit.replace(uri, commentRange, comment);
                console.log(`更新现有时间戳注释: ${uri.fsPath} (行 ${commentRange.start.line}-${commentRange.end.line})`);
            } else {
                // 如果找不到完整的注释块，在开头插入
                edit.insert(uri, new vscode.Position(0, 0), comment);
                console.log(`插入新时间戳注释: ${uri.fsPath} (未找到完整注释块)`);
            }
        }

        try {
            await vscode.workspace.applyEdit(edit);
            await document.save();
        } catch (error) {
            console.error('更新现有时间戳注释失败:', error);
        }
    }

    private findTimestampCommentRange(document: vscode.TextDocument, timestampRegex: RegExp): vscode.Range | null {
        let lastStartLine = -1;
        let lastEndLine = -1;
        
        // 扫描文件前20行，找到最后一个时间戳注释块
        for (let i = 0; i < Math.min(20, document.lineCount); i++) {
            const line = document.lineAt(i);
            
            // 如果找到时间戳相关的行
            if (timestampRegex.test(line.text)) {
                // 每次找到时间戳注释，都重新确定注释块的范围
                const blockStart = this.findCommentBlockStart(document, i);
                const blockEnd = this.findCommentBlockEnd(document, i);
                
                // 更新为最后找到的注释块
                lastStartLine = blockStart;
                lastEndLine = blockEnd;
                
                console.log(`找到时间戳注释块: 行 ${blockStart}-${blockEnd}`);
            }
        }
        
        if (lastStartLine >= 0 && lastEndLine >= 0) {
            return new vscode.Range(lastStartLine, 0, lastEndLine + 1, 0);
        }
        
        return null;
    }

    private findCommentBlockStart(document: vscode.TextDocument, fromLine: number): number {
        // 从给定行向上查找注释块的开始
        for (let i = fromLine; i >= 0; i--) {
            const line = document.lineAt(i);
            const trimmed = line.text.trim();
            
            // 检查是否是注释块的开始标记
            if (trimmed.startsWith('/**') || 
                trimmed.startsWith('/*') ||
                trimmed.startsWith('<!--') ||
                trimmed.startsWith('"""') ||
                trimmed.startsWith('=begin') ||
                trimmed.startsWith('<#') ||
                trimmed.startsWith('--[[')) {
                return i;
            }
            
            // 如果是单行注释的延续，继续向上查找
            if (trimmed.startsWith('//') || 
                trimmed.startsWith('#') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('%') ||
                trimmed.startsWith('"') ||
                trimmed.startsWith(';') ||
                trimmed.startsWith('--')) {
                continue;
            }
            
            // 如果遇到非注释行，停止查找
            if (trimmed.length > 0) {
                return i + 1;
            }
        }
        
        return fromLine;
    }

    private findCommentBlockEnd(document: vscode.TextDocument, fromLine: number): number {
        const ext = path.extname(document.uri.fsPath).toLowerCase();
        
        // 从给定行向下查找注释块的结束
        for (let i = fromLine; i < Math.min(fromLine + 15, document.lineCount); i++) {
            const line = document.lineAt(i);
            const trimmed = line.text.trim();
            
            // 检查多行注释的结束标记
            if (trimmed.includes('*/') || 
                trimmed.includes('-->') || 
                trimmed.includes('"""') ||
                trimmed.includes('%}') ||
                trimmed.includes('#>') ||
                trimmed.includes('=end') ||
                trimmed.includes(']]') ||
                trimmed.includes('-}')) {
                return i;
            }
            
            // 对于单行注释，检查下一行是否还是注释
            if (i < document.lineCount - 1) {
                const nextLine = document.lineAt(i + 1);
                const nextTrimmed = nextLine.text.trim();
                
                // 如果下一行不是注释或者是空行，当前行就是结束
                if (nextTrimmed.length === 0 || 
                    (!nextTrimmed.startsWith('//') && 
                     !nextTrimmed.startsWith('#') &&
                     !nextTrimmed.startsWith('*') &&
                     !nextTrimmed.startsWith('%') &&
                     !nextTrimmed.startsWith('"') &&
                     !nextTrimmed.startsWith(';') &&
                     !nextTrimmed.startsWith('--'))) {
                    return i;
                }
            }
        }
        
        return fromLine;
    }

    private async insertNewTimestampComment(uri: vscode.Uri): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();
        
        const fileInfo = this.fileTimestamps.get(uri.fsPath);
        
        // 生成新的时间戳注释
        const comment = this.commentManager.generateTimestampComment(
            uri.fsPath,
            fileInfo?.lastModified || new Date(),
            fileInfo?.previousModified,
            fileInfo?.size
        );

        if (!comment) {
            console.log(`无法为文件生成时间戳注释: ${uri.fsPath}`);
            return;
        }

        // 在文件开头插入新注释
        edit.insert(uri, new vscode.Position(0, 0), comment);
        
        console.log(`插入新时间戳注释: ${uri.fsPath}`);

        try {
            await vscode.workspace.applyEdit(edit);
            await document.save();
        } catch (error) {
            console.error('插入新时间戳注释失败:', error);
        }
    }

    private async updateExistingTimestampCommentWithTimes(uri: vscode.Uri, lastModified: Date, previousModified?: Date, fileSize?: number): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();
        
        // 生成新的时间戳注释，使用传入的时间参数
        const comment = this.commentManager.generateTimestampComment(
            uri.fsPath,
            lastModified,
            previousModified,
            fileSize
        );

        if (!comment) {
            console.log(`无法为文件生成时间戳注释: ${uri.fsPath}`);
            return;
        }

        // 找到现有的时间戳注释并替换
        const timestampRegex = this.commentManager.getTimestampRegex(uri.fsPath);
        
        if (timestampRegex && document.lineCount > 0) {
            const commentRange = this.findTimestampCommentRange(document, timestampRegex);
            
            if (commentRange) {
                // 替换现有注释
                edit.replace(uri, commentRange, comment);
                console.log(`更新现有时间戳注释: ${uri.fsPath} (行 ${commentRange.start.line}-${commentRange.end.line})`);
            } else {
                // 如果找不到完整的注释块，在开头插入
                edit.insert(uri, new vscode.Position(0, 0), comment);
                console.log(`插入新时间戳注释: ${uri.fsPath} (未找到完整注释块)`);
            }
        }

        try {
            await vscode.workspace.applyEdit(edit);
            await document.save();
        } catch (error) {
            console.error('更新现有时间戳注释失败:', error);
        }
    }

    private async insertNewTimestampCommentWithTimes(uri: vscode.Uri, lastModified: Date, previousModified?: Date, fileSize?: number): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();
        
        // 生成新的时间戳注释，使用传入的时间参数
        const comment = this.commentManager.generateTimestampComment(
            uri.fsPath,
            lastModified,
            previousModified,
            fileSize
        );

        if (!comment) {
            console.log(`无法为文件生成时间戳注释: ${uri.fsPath}`);
            return;
        }

        // 在文件开头插入新注释
        edit.insert(uri, new vscode.Position(0, 0), comment);
        
        console.log(`插入新时间戳注释: ${uri.fsPath}`);

        try {
            await vscode.workspace.applyEdit(edit);
            await document.save();
        } catch (error) {
            console.error('插入新时间戳注释失败:', error);
        }
    }

    public updateFileChange(filePath: string, changeDescription: string): void {
        const fileTimestamp = this.fileTimestamps.get(filePath);
        if (fileTimestamp) {
            fileTimestamp.changes.push(`${moment().format('HH:mm')} - ${changeDescription}`);
            // 只保留最近的5个变更记录
            if (fileTimestamp.changes.length > 5) {
                fileTimestamp.changes = fileTimestamp.changes.slice(-5);
            }
            this._onDidChangeTreeData.fire();
        }
    }
}