# Timestamp Tracker VSCode 插件

一个自动跟踪文件修改时间戳并推送到 GitHub 的 VSCode 插件。

## 📦 项目信息

- **GitHub 仓库**: [https://github.com/lujian1997524/time.git](https://github.com/lujian1997524/time.git)
- **作者**: lujian1997524
- **许可证**: MIT
- **当前版本**: v0.1.6

## 功能特性

### 🕒 时间戳跟踪
- 自动检测文件创建、修改、删除
- 在文件中自动添加时间戳注释
- 显示最后修改时间和上次修改时间
- 记录文件大小变化
- **遵循 .gitignore 规则，不跟踪被忽略的文件**

### 📝 智能注释系统
- **支持 30+ 种编程语言的注释格式**
- 根据文件扩展名自动选择合适的注释样式
- 支持单行注释和多行注释块
- 自动更新现有时间戳注释

### 📊 活动栏集成
- 在 VSCode 左侧活动栏添加时间戳跟踪图标
- 与资源管理器、搜索、扩展等功能并列显示
- 树状视图显示所有跟踪的文件
- 支持文件快速导航

### 🔄 自动 Git 操作
- 自动暂存修改的文件
- 定时自动提交变更
- 自动推送到远程 GitHub 仓库
- 可配置的提交间隔
- **遵循 .gitignore 规则，不提交被忽略的文件**

### ⚙️ 灵活配置
- 自定义时间戳格式
- 设置自动提交间隔
- 配置 Git 仓库地址
- 启用/禁用自动操作
- **支持多工作区独立配置**：每个VSCode工作区都有自己的配置

## 🚀 安装方式

### 从源码安装

1. **克隆仓库**:
   ```bash
   git clone https://github.com/lujian1997524/time.git
   cd time
   ```

2. **安装依赖**:
   ```bash
   npm install
   ```

3. **构建扩展**:
   ```bash
   npm run build
   ```

4. **安装到 VSCode**:
   - 在 VSCode 中按 `Cmd+Shift+P`（macOS）或 `Ctrl+Shift+P`（Windows/Linux）
   - 输入 "Extensions: Install from VSIX"
   - 选择生成的 `.vsix` 文件

### 从 Release 安装

1. 访问 [GitHub Releases](https://github.com/lujian1997524/time/releases)
2. 下载最新版本的 `.vsix` 文件
3. 在 VSCode 中安装该文件

## 安装和使用

### 1. 编译插件

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 监听模式（开发时使用）
npm run watch
```

### 2. 在 VSCode 中加载插件

1. 按 `F5` 启动插件开发模式
2. 在新窗口中打开一个项目
3. 在左侧活动栏找到时钟图标
4. 点击图标查看时间戳跟踪面板

### 3. 配置插件

打开 VSCode 设置，搜索 "timestampTracker"：

- **autoCommitInterval**: 自动提交间隔（秒，默认 300）
- **enableAutoCommit**: 启用自动提交（默认 true）
- **gitRepository**: Git 仓库地址（为空时使用当前工作区的远程仓库）
- **timestampFormat**: 时间戳格式（默认 YYYY-MM-DD HH:mm:ss）

**多工作区支持**：
- 所有设置都是按工作区配置的，每个VSCode窗口可以有不同的设置
- 如果同时打开多个项目，每个项目都可以有自己的Git仓库地址和配置
- 这避免了所有项目推送到同一个仓库的问题

## 界面说明

### 活动栏图标
- 点击时钟图标打开时间戳跟踪面板

### 侧边栏面板
- **文件时间戳**: 显示所有跟踪的文件及其修改时间
- **Git 状态**: 显示当前 Git 状态和操作

### 工具栏按钮
- 🔄 **刷新**: 重新扫描工作区文件
- ➕ **添加时间戳**: 手动为当前文件添加时间戳
- ⚙️ **设置**: 打开插件配置

## 支持的文件类型

插件支持 30+ 种编程语言的时间戳注释，包括：

### 主流编程语言
- **JavaScript/TypeScript**: `.js`, `.jsx`, `.ts`, `.tsx` - `/** */` 格式
- **Python**: `.py` - `"""` 格式
- **Java**: `.java` - `/** */` 格式
- **C/C++**: `.c`, `.cpp`, `.cc`, `.h`, `.hpp` - `/** */` 格式
- **C#**: `.cs` - `/** */` 格式
- **Go**: `.go` - `/*` 格式
- **Rust**: `.rs` - `/*` 格式
- **PHP**: `.php` - `/** */` 格式

### 脚本语言
- **Ruby**: `.rb` - `#` 和 `=begin/=end` 格式
- **Shell**: `.sh`, `.bash`, `.zsh` - `#` 格式
- **PowerShell**: `.ps1` - `#` 和 `<#/#>` 格式
- **Perl**: `.pl` - `#` 格式
- **Lua**: `.lua` - `--` 和 `--[[/]]` 格式

### 标记语言
- **HTML/XML**: `.html`, `.htm`, `.xml`, `.svg` - `<!-- -->` 格式
- **CSS/SCSS/LESS**: `.css`, `.scss`, `.sass`, `.less` - `/*` 格式
- **Markdown**: `.md`, `.markdown` - `<!-- -->` 格式

### 配置文件
- **YAML**: `.yml`, `.yaml` - `#` 格式
- **TOML**: `.toml` - `#` 格式
- **INI**: `.ini` - `;` 格式

### 其他语言
- **Swift**: `.swift` - `/** */` 格式
- **Kotlin**: `.kt` - `/** */` 格式
- **Dart**: `.dart` - `/** */` 格式
- **R**: `.r` - `#` 格式
- **MATLAB**: `.m` - `%` 和 `%{/%}` 格式
- **Haskell**: `.hs` - `--` 和 `{-/-}` 格式
- **Scala**: `.scala` - `/** */` 格式
- **LaTeX**: `.tex` - `%` 格式
- **Vim Script**: `.vim` - `"` 格式

### 特殊文件
- **Dockerfile** - `#` 格式
- **Makefile** - `#` 格式

**注意**: JSON 文件不支持注释，因此不会添加时间戳注释。

## 时间戳注释示例

### JavaScript/TypeScript
```javascript
/**
 * 最后修改时间: 2024-01-19 19:25:30
 * 上次修改时间: 2024-01-19 18:45:12
 * 文件大小: 2048 bytes
 */
```

### Python
```python
\"\"\"
最后修改时间: 2024-01-19 19:25:30
上次修改时间: 2024-01-19 18:45:12
文件大小: 2048 bytes
\"\"\"
```

## 命令

- `timestampTracker.refresh`: 刷新文件列表
- `timestampTracker.addTimestamp`: 添加时间戳
- `timestampTracker.pushToGit`: 推送到 Git
- `timestampTracker.settings`: 打开设置

## 开发

### 项目结构
```
├── src/
│   ├── extension.ts      # 插件入口
│   ├── timestampProvider.ts  # 时间戳数据提供器
│   ├── fileWatcher.ts    # 文件监听器
│   ├── gitManager.ts     # Git 操作管理器
│   ├── gitIgnoreManager.ts   # .gitignore 解析器
│   └── commentManager.ts     # 注释格式管理器
├── package.json          # 插件清单
├── tsconfig.json        # TypeScript 配置
├── dev.sh              # 开发脚本
└── README.md           # 项目说明
```

### 技术栈
- TypeScript
- VSCode Extension API
- simple-git (Git 操作)
- moment.js (时间处理)

### 开发命令

```bash
# 开发模式（监听文件变化）
npm run watch

# 编译代码
npm run compile

# 构建扩展包
npm run build

# 更新版本
npm run version:patch    # 0.1.3 → 0.1.4
npm run version:minor    # 0.1.3 → 0.2.0
npm run version:major    # 0.1.3 → 1.0.0

# 使用开发脚本
./dev.sh dev     # 启动开发模式
./dev.sh build   # 构建扩展
./dev.sh patch   # 更新补丁版本并构建
```

## 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献流程

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 提交修改: `git commit -am 'Add some feature'`
4. 推送分支: `git push origin feature/your-feature`
5. 提交 Pull Request

### 报告问题

如果您发现 bug 或有功能建议，请在 [GitHub Issues](https://github.com/lujian1997524/time/issues) 中提交。

## 许可证

MIT License - 详见 [LICENSE](https://github.com/lujian1997524/time/blob/main/LICENSE) 文件。

## 致谢

感谢所有为这个项目做出贡献的开发者！