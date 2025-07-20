import * as path from 'path';
import * as moment from 'moment';

export interface CommentStyle {
    start: string;
    end?: string;
    line?: string;
    multiLineStart?: string;
    multiLineEnd?: string;
    multiLinePrefix?: string;
}

export class CommentManager {
    private commentStyles: Map<string, CommentStyle> = new Map();

    constructor() {
        this.initializeCommentStyles();
    }

    private initializeCommentStyles(): void {
        // JavaScript/TypeScript 系列
        this.commentStyles.set('.js', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.jsx', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.ts', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.tsx', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // Java/C/C++ 系列
        this.commentStyles.set('.java', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.c', {
            start: '//',
            multiLineStart: '/*',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.cpp', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.cc', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.h', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.hpp', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // C#
        this.commentStyles.set('.cs', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // Python
        this.commentStyles.set('.py', {
            start: '#',
            multiLineStart: '"""',
            multiLineEnd: '"""',
            multiLinePrefix: ''
        });

        // Ruby
        this.commentStyles.set('.rb', {
            start: '#',
            multiLineStart: '=begin',
            multiLineEnd: '=end',
            multiLinePrefix: ''
        });

        // PHP
        this.commentStyles.set('.php', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // Go
        this.commentStyles.set('.go', {
            start: '//',
            multiLineStart: '/*',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // Rust
        this.commentStyles.set('.rs', {
            start: '//',
            multiLineStart: '/*',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // HTML/XML
        this.commentStyles.set('.html', {
            start: '<!--',
            end: ' -->'
        });
        
        this.commentStyles.set('.htm', {
            start: '<!--',
            end: ' -->'
        });
        
        this.commentStyles.set('.xml', {
            start: '<!--',
            end: ' -->'
        });
        
        this.commentStyles.set('.svg', {
            start: '<!--',
            end: ' -->'
        });

        // CSS/SCSS/LESS
        this.commentStyles.set('.css', {
            start: '/*',
            end: ' */'
        });
        
        this.commentStyles.set('.scss', {
            start: '//',
            multiLineStart: '/*',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.sass', {
            start: '//',
            multiLineStart: '/*',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });
        
        this.commentStyles.set('.less', {
            start: '//',
            multiLineStart: '/*',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // Shell scripts
        this.commentStyles.set('.sh', {
            start: '#'
        });
        
        this.commentStyles.set('.bash', {
            start: '#'
        });
        
        this.commentStyles.set('.zsh', {
            start: '#'
        });

        // PowerShell
        this.commentStyles.set('.ps1', {
            start: '#',
            multiLineStart: '<#',
            multiLineEnd: '#>',
            multiLinePrefix: ''
        });

        // SQL
        this.commentStyles.set('.sql', {
            start: '--',
            multiLineStart: '/*',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // YAML
        this.commentStyles.set('.yml', {
            start: '#'
        });
        
        this.commentStyles.set('.yaml', {
            start: '#'
        });

        // JSON (特殊处理，因为标准 JSON 不支持注释)
        // this.commentStyles.set('.json', null); // 不添加注释

        // TOML
        this.commentStyles.set('.toml', {
            start: '#'
        });

        // INI
        this.commentStyles.set('.ini', {
            start: ';'
        });

        // Lua
        this.commentStyles.set('.lua', {
            start: '--',
            multiLineStart: '--[[',
            multiLineEnd: ']]',
            multiLinePrefix: ''
        });

        // Swift
        this.commentStyles.set('.swift', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // Kotlin
        this.commentStyles.set('.kt', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // Dart
        this.commentStyles.set('.dart', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // R
        this.commentStyles.set('.r', {
            start: '#'
        });

        // MATLAB
        this.commentStyles.set('.m', {
            start: '%',
            multiLineStart: '%{',
            multiLineEnd: '%}',
            multiLinePrefix: ''
        });

        // Perl
        this.commentStyles.set('.pl', {
            start: '#'
        });

        // Haskell
        this.commentStyles.set('.hs', {
            start: '--',
            multiLineStart: '{-',
            multiLineEnd: '-}',
            multiLinePrefix: ''
        });

        // Scala
        this.commentStyles.set('.scala', {
            start: '//',
            multiLineStart: '/**',
            multiLineEnd: ' */',
            multiLinePrefix: ' * '
        });

        // Markdown
        this.commentStyles.set('.md', {
            start: '<!--',
            end: ' -->'
        });
        
        this.commentStyles.set('.markdown', {
            start: '<!--',
            end: ' -->'
        });

        // LaTeX
        this.commentStyles.set('.tex', {
            start: '%'
        });

        // Vim script
        this.commentStyles.set('.vim', {
            start: '"'
        });

        // Dockerfile
        this.commentStyles.set('dockerfile', {
            start: '#'
        });

        // Makefile
        this.commentStyles.set('makefile', {
            start: '#'
        });
    }

    public generateTimestampComment(filePath: string, lastModified: Date, previousModified?: Date, fileSize?: number): string | null {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath).toLowerCase();
        
        // 特殊文件名处理
        let commentStyle: CommentStyle | null = null;
        if (fileName === 'dockerfile') {
            commentStyle = this.commentStyles.get('dockerfile') || null;
        } else if (fileName === 'makefile') {
            commentStyle = this.commentStyles.get('makefile') || null;
        } else {
            commentStyle = this.commentStyles.get(ext) || null;
        }

        if (!commentStyle) {
            console.log(`不支持的文件类型: ${filePath}`);
            return null;
        }

        const timestamp = moment(lastModified).format('YYYY-MM-DD HH:mm:ss');
        const previousTimestamp = previousModified ? moment(previousModified).format('YYYY-MM-DD HH:mm:ss') : null;
        
        // 生成注释内容
        if (commentStyle.multiLineStart && commentStyle.multiLineEnd) {
            return this.generateMultiLineComment(commentStyle, timestamp, previousTimestamp, fileSize);
        } else if (commentStyle.start && commentStyle.end) {
            return this.generateSingleLineWithEndComment(commentStyle, timestamp, previousTimestamp, fileSize);
        } else if (commentStyle.start) {
            return this.generateSingleLineComment(commentStyle, timestamp, previousTimestamp, fileSize);
        }

        return null;
    }

    private generateMultiLineComment(style: CommentStyle, timestamp: string, previousTimestamp?: string | null, fileSize?: number): string {
        let comment = style.multiLineStart + '\n';
        comment += (style.multiLinePrefix || '') + `最后修改时间: ${timestamp}\n`;
        
        if (previousTimestamp) {
            comment += (style.multiLinePrefix || '') + `上次修改时间: ${previousTimestamp}\n`;
        }
        
        if (fileSize !== undefined) {
            comment += (style.multiLinePrefix || '') + `文件大小: ${fileSize} bytes\n`;
        }
        
        comment += style.multiLineEnd + '\n';
        return comment;
    }

    private generateSingleLineWithEndComment(style: CommentStyle, timestamp: string, previousTimestamp?: string | null, fileSize?: number): string {
        let comment = style.start + `\n最后修改时间: ${timestamp}`;
        
        if (previousTimestamp) {
            comment += `\n上次修改时间: ${previousTimestamp}`;
        }
        
        if (fileSize !== undefined) {
            comment += `\n文件大小: ${fileSize} bytes`;
        }
        
        comment += '\n' + style.end + '\n';
        return comment;
    }

    private generateSingleLineComment(style: CommentStyle, timestamp: string, previousTimestamp?: string | null, fileSize?: number): string {
        let comment = style.start + ` 最后修改时间: ${timestamp}\n`;
        
        if (previousTimestamp) {
            comment += style.start + ` 上次修改时间: ${previousTimestamp}\n`;
        }
        
        if (fileSize !== undefined) {
            comment += style.start + ` 文件大小: ${fileSize} bytes\n`;
        }
        
        return comment;
    }

    public isCommentSupported(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath).toLowerCase();
        
        return this.commentStyles.has(ext) || 
               this.commentStyles.has(fileName) ||
               (fileName === 'dockerfile' || fileName === 'makefile');
    }

    public getTimestampRegex(filePath: string): RegExp | null {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath).toLowerCase();
        
        // 根据文件类型返回匹配现有时间戳注释的正则表达式
        if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx' || 
            ext === '.java' || ext === '.c' || ext === '.cpp' || ext === '.cs') {
            // 匹配 /** 开头的多行注释或者包含时间戳的单行注释
            return /(\/\*\*|\/\*|\s\*|\/\/).*?(最后修改时间|修改时间|Last modified|Modified)/i;
        } else if (ext === '.py') {
            // 匹配 Python 的注释
            return /(\"\"\"|\"\"\"|#).*?(最后修改时间|修改时间|Last modified|Modified)/i;
        } else if (ext === '.html' || ext === '.xml' || ext === '.md') {
            // 匹配 HTML/XML 注释
            return /(<!--).*?(最后修改时间|修改时间|Last modified|Modified)/i;
        } else if (ext === '.sh' || ext === '.py' || fileName === 'dockerfile' || fileName === 'makefile') {
            // 匹配 # 注释
            return /(#).*?(最后修改时间|修改时间|Last modified|Modified)/i;
        }
        
        // 通用匹配
        return /(\/\/|#|<!--|\*|%).*?(最后修改时间|修改时间|Last modified|Modified)/i;
    }
}