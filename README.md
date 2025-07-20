<!--
最后修改时间: 2025-07-20 10:00:00
上次修改时间: 2025-07-20 09:58:08
文件大小: 8752 bytes
 -->
<!--
最后修改时间: 2025-07-20 09:58:07
上次修改时间: 2025-07-20 09:22:29
文件大小: 8680 bytes
 -->
# Timestamp Tracker VSCode 插件

一个自动跟踪文件修改时间戳并推送到 GitHub 的 VSCode 插件。

## 📦 项目信息

- **GitHub 仓库**: [https://github.com/lujian1997524/time.git](https://github.com/lujian1997524/time.git)
- **作者**: lujian1997524
- **许可证**: MIT
- **当前版本**: v1.0.0

## 🌟 核心功能

### 🕒 智能时间戳跟踪
- 自动检测文件创建、修改、删除
- 在文件中自动添加和更新时间戳注释
- 准确记录最后修改时间和上次修改时间
- 显示文件大小变化
- **支持外部工具集成**：检测外部工具对文件的修改并自动添加时间戳
- **遵循 .gitignore 规则**，不跟踪被忽略的文件

### 🧠 智能 Git 提交信息
- **智能分析代码变化**：自动识别新功能、错误修复、性能优化等
- **从代码注释中提取意图**：分析代码注释生成有意义的提交信息
- **分类提交内容**：用emoji标识不同类型的变更（✨新功能、🐛修复、⚡优化、🔧配置、📚文档）
- **告别"自动提交-日期"**：生成具体描述功能变化的提交信息

### 📝 多语言注释系统
- **支持 30+ 种编程语言的注释格式**
- 根据文件扩展名自动选择合适的注释样式
- 支持单行注释和多行注释块
- 智能更新现有时间戳注释，避免重复添加

### 📊 活动栏集成
- 在 VSCode 左侧活动栏添加时间戳跟踪图标
- 与资源管理器、搜索、扩展等功能并列显示
- 树状视图显示所有跟踪的文件
- 支持文件快速导航和实时状态更新

### 🔄 自动 Git 操作
- 自动暂存修改的文件
- 定时自动提交变更
- 自动推送到远程 GitHub 仓库
- 可配置的提交间隔
- **手动强制推送覆盖功能**：一键覆盖远程仓库内容
- **遵循 .gitignore 规则**，不提交被忽略的文件

### ⚙️ 多工作区支持
- **独立配置**：每个 VSCode 工作区都有自己的配置
- 自定义时间戳格式
- 设置自动提交间隔
- 配置 Git 仓库地址
- 启用/禁用自动操作
- 避免多项目推送到同一仓库的问题

## 🚀 安装方式

### 从 Release 安装（推荐）

1. 访问 [GitHub Releases](https://github.com/lujian1997524/time/releases)
2. 下载最新版本的 `timestamp-tracker-1.0.0.vsix` 文件
3. 在 VSCode 中按 `Cmd+Shift+P`（macOS）或 `Ctrl+Shift+P`（Windows/Linux）
4. 输入 "Extensions: Install from VSIX"
5. 选择下载的 `.vsix` 文件进行安装

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
   - 生成的 `timestamp-tracker-1.0.0.vsix` 文件可直接安装

## 📖 使用指南

### 1. 快速开始

安装插件后：
1. 在左侧活动栏找到时钟图标 🕒
2. 点击图标打开时间戳跟踪面板
3. 打开任意文件进行编辑，插件会自动添加时间戳注释
4. 配置 Git 仓库地址以启用自动推送功能

### 2. 配置插件

打开 VSCode 设置，搜索 "timestampTracker"：

- **autoCommitInterval**: 自动提交间隔（秒，默认 300）
- **enableAutoCommit**: 启用自动提交（默认 true）
- **gitRepository**: Git 仓库地址（为空时使用当前工作区的远程仓库）
- **timestampFormat**: 时间戳格式（默认 YYYY-MM-DD HH:mm:ss）

**多工作区配置**：
- 所有设置都是按工作区配置的，每个VSCode窗口可以有不同的设置
- 如果同时打开多个项目，每个项目都可以有自己的Git仓库地址和配置
- 这避免了所有项目推送到同一个仓库的问题

### 3. 界面说明

#### 活动栏图标
- 点击时钟图标 🕒 打开时间戳跟踪面板

#### 侧边栏面板
- **文件时间戳**: 显示所有跟踪的文件及其修改时间
- **Git 状态**: 显示当前 Git 状态和操作

#### 工具栏按钮
- 🔄 **刷新**: 重新扫描工作区文件
- ➕ **添加时间戳**: 手动为当前文件添加时间戳
- 🔄 **强制推送覆盖**: 强制推送本地内容覆盖远程仓库（⚠️ 危险操作）
- ⚙️ **设置**: 打开插件配置
- ℹ️ **显示当前配置**: 查看当前工作区配置
- 🕒 **强制添加时间戳**: 强制为当前文件添加时间戳
- 🔧 **测试Claude Code操作**: 测试外部工具集成

## 💻 支持的文件类型

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

## 📝 时间戳注释示例

### JavaScript/TypeScript
```javascript
/**
 * 最后修改时间: 2025-07-20 10:30:15
 * 上次修改时间: 2025-07-20 09:45:30
 * 文件大小: 2048 bytes
 */
```

### Python
```python
"""
最后修改时间: 2025-07-20 10:30:15
上次修改时间: 2025-07-20 09:45:30
文件大小: 2048 bytes
"""
```

## 🤖 智能提交信息示例

### 功能分析提交
```
✨ 新增用户认证管理功能

🐛 修复会话过期问题
⚡ 优化数据库查询性能

🕒 2025-07-20 10:30:15
```

### 代码变更提交
```
修改3个文件, 新增1个文件

🕒 2025-07-20 10:30:15
```

## 🛠️ 开发

### 项目结构
```
├── src/
│   ├── extension.ts           # 插件入口
│   ├── timestampProvider.ts   # 时间戳数据提供器
│   ├── fileWatcher.ts         # 文件监听器（支持外部工具检测）
│   ├── gitManager.ts          # Git 操作管理器（智能提交信息）
│   ├── gitIgnoreManager.ts    # .gitignore 解析器
│   └── commentManager.ts      # 注释格式管理器
├── package.json               # 插件清单
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目说明
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

# 版本管理
npm run version:patch    # x.x.1 - 补丁版本
npm run version:minor    # x.1.0 - 小版本更新
npm run version:major    # 1.0.0 - 大版本更新
```

## 🔄 版本管理

插件遵循语义化版本控制：

- **1.0.0** - 主要版本更新（重大架构变更）
- **x.1.0** - 次要版本更新（新功能添加）
- **x.x.1** - 补丁版本更新（错误修复）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献流程

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 提交修改: `git commit -am 'Add some feature'`
4. 推送分支: `git push origin feature/your-feature`
5. 提交 Pull Request

### 报告问题

如果您发现 bug 或有功能建议，请在 [GitHub Issues](https://github.com/lujian1997524/time/issues) 中提交。

## 📄 许可证

MIT License - 详见 [LICENSE](https://github.com/lujian1997524/time/blob/main/LICENSE) 文件。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**v1.0.0 正式版本** - 完整功能，稳定可靠，支持智能代码分析和 Claude Code 工具集成。