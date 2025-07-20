/**
 * 最后修改时间: 2025-07-20 09:28:02
 * 上次修改时间: 2025-07-20 09:28:02
 * 文件大小: 19464 bytes
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
            
            const stats = fs.statSync(uri.fsPath);
            this.addFileTimestamp(uri.fsPath, stats);
            
            // 只为支持的文件类型更新时间戳注释
            if (this.commentManager.isCommentSupported(uri.fsPath)) {
                console.log(`文件支持注释，正在更新时间戳注释: ${uri.fsPath}`);
                // 传递正确的previousModified时间给注释更新
                this.updateTimestampCommentWithTimes(uri, stats.mtime, previousModifiedTime, stats.size);
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
            const hasExistingComment = await this.hasTimestampComment(document);
            
            if (hasExistingComment) {
                await this.updateExistingTimestampComment(uri);
            } else {
                await this.insertNewTimestampComment(uri);
            }
        } catch (error) {
            console.error('更新时间戳注释失败:', error);
        }
    }

    public async updateTimestampCommentWithTimes(uri: vscode.Uri, lastModified: Date, previousModified?: Date, fileSize?: number): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const hasExistingComment = await this.hasTimestampComment(document);
            
            if (hasExistingComment) {
                await this.updateExistingTimestampCommentWithTimes(uri, lastModified, previousModified, fileSize);
            } else {
                await this.insertNewTimestampCommentWithTimes(uri, lastModified, previousModified, fileSize);
            }
        } catch (error) {
            console.error('更新时间戳注释失败:', error);
        }
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
        let startLine = -1;
        let endLine = -1;
        
        // 扫描文件前20行（增加扫描范围）
        for (let i = 0; i < Math.min(20, document.lineCount); i++) {
            const line = document.lineAt(i);
            
            // 如果找到时间戳相关的行
            if (timestampRegex.test(line.text)) {
                if (startLine === -1) {
                    // 找到第一个匹配行，需要向上查找注释块的真正开始
                    startLine = this.findCommentBlockStart(document, i);
                }
                endLine = i;
            }
        }
        
        if (startLine >= 0 && endLine >= 0) {
            // 继续向下查找注释块的结束
            const actualEndLine = this.findCommentBlockEnd(document, endLine);
            return new vscode.Range(startLine, 0, actualEndLine + 1, 0);
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