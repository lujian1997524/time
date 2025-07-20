# 多工作区配置测试指南

## 测试目的
验证插件在多个VSCode窗口中可以为不同项目设置不同的GitHub仓库地址。

## 测试步骤

### 1. 准备测试环境

#### 创建两个测试项目文件夹：
```bash
# 创建项目A
mkdir ~/test-project-a
cd ~/test-project-a
echo "# 项目A" > README.md

# 创建项目B  
mkdir ~/test-project-b
cd ~/test-project-b
echo "# 项目B" > README.md
```

### 2. 安装插件
在VSCode中安装 `timestamp-tracker-0.1.6.vsix`

### 3. 测试多工作区配置

#### 步骤1：打开第一个项目
1. 打开VSCode窗口1
2. 打开文件夹 `~/test-project-a`
3. 按 `Cmd+Shift+P`，搜索 "Preferences: Open Workspace Settings"
4. 搜索 "timestampTracker"
5. 设置 Git 仓库地址为：`https://github.com/user/project-a.git`

#### 步骤2：打开第二个项目
1. 新建VSCode窗口2 (File -> New Window)
2. 打开文件夹 `~/test-project-b`  
3. 按 `Cmd+Shift+P`，搜索 "Preferences: Open Workspace Settings"
4. 搜索 "timestampTracker"
5. 设置 Git 仓库地址为：`https://github.com/user/project-b.git`

#### 步骤3：验证配置独立性
1. 在窗口1中，检查设置显示的是 project-a 的仓库地址
2. 在窗口2中，检查设置显示的是 project-b 的仓库地址
3. 修改窗口1的设置，确认窗口2的设置不受影响

### 4. 验证运行时行为

#### 测试Git操作：
1. 在项目A中修改文件并保存
2. 在项目B中修改文件并保存
3. 查看开发者控制台日志，确认：
   - 项目A的推送指向 project-a 仓库
   - 项目B的推送指向 project-b 仓库

## 预期结果

✅ **成功的标志**：
- 每个VSCode窗口可以设置不同的Git仓库地址
- 设置互相独立，修改一个不影响另一个
- 推送操作使用各自工作区的配置

❌ **失败的标志**：
- 所有窗口显示相同的设置
- 修改一个窗口的设置影响其他窗口
- 所有项目推送到同一个仓库

## 配置文件位置

### 工作区级别配置（正确）：
- 位置：`项目根目录/.vscode/settings.json`
- 格式：
```json
{
    "timestampTracker.gitRepository": "https://github.com/user/project-specific.git",
    "timestampTracker.enableAutoCommit": true,
    "timestampTracker.autoCommitInterval": 300
}
```

### 全局配置（错误的情况）：
- 位置：`~/Library/Application Support/Code/User/settings.json` (macOS)
- 如果配置出现在这里，说明多工作区配置失败

## 调试信息

在开发者控制台中查找以下日志：
```
自动提交配置 - 启用: true, 间隔: 300 秒
使用现有远程仓库: origin -> [仓库地址]
推送到远程仓库成功: [仓库地址]
```

每个项目应该显示不同的仓库地址。

## 问题排查

如果多工作区配置不工作：

1. **检查VSCode版本**：确保VSCode版本 >= 1.74.0
2. **检查插件版本**：确保使用 v0.1.6 或更高版本
3. **检查配置范围**：确认在工作区设置而不是用户设置中配置
4. **重启VSCode**：修改配置后重启VSCode窗口
5. **查看日志**：开发者工具 -> Console 查看详细日志