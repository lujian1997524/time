# 🧪 时间戳插件手动测试完整指南

## 📋 测试完成状态

### ✅ 已完成的自动化测试
- [x] 测试环境创建 (21/21 项通过)
- [x] 文件结构验证
- [x] Git仓库初始化
- [x] VSCode工作区配置
- [x] 时间戳格式模拟

## 🎯 手动测试步骤

### 第一步：安装插件
1. 确保 VSCode 已安装
2. 安装插件包：`timestamp-tracker-0.1.8.vsix`
   ```bash
   # 方法1：通过VSCode界面
   # Cmd+Shift+P → "Extensions: Install from VSIX"
   
   # 方法2：通过命令行（如果有code命令）
   # code --install-extension /Users/gao/Desktop/time/timestamp-tracker-0.1.8.vsix
   ```

### 第二步：打开测试项目
1. **打开项目A**：
   ```bash
   open -a "Visual Studio Code" ~/test-timestamp-plugin/project-a
   ```
   
2. **打开项目B**（新窗口）：
   ```bash
   open -a "Visual Studio Code" ~/test-timestamp-plugin/project-b
   ```

### 第三步：验证插件加载
在每个VSCode窗口中检查：
- [ ] 左侧活动栏显示 🕒 时钟图标
- [ ] 点击时钟图标显示插件面板
- [ ] 插件面板显示"文件时间戳"和"Git状态"视图

### 第四步：测试多工作区配置 🔧

#### 在项目A窗口：
1. 点击 ℹ️ "显示当前配置" 按钮
2. 验证显示信息：
   - [ ] 工作区: project-a
   - [ ] Git仓库: https://github.com/test/project-a.git
   - [ ] 提交间隔: 60 秒
   - [ ] 时间戳格式: YYYY-MM-DD HH:mm:ss

#### 在项目B窗口：
1. 点击 ℹ️ "显示当前配置" 按钮
2. 验证显示信息：
   - [ ] 工作区: project-b
   - [ ] Git仓库: https://github.com/test/project-b.git
   - [ ] 提交间隔: 120 秒
   - [ ] 时间戳格式: YYYY/MM/DD HH:mm:ss

### 第五步：测试时间戳添加功能 🕒

#### 方法1：强制添加时间戳
1. 打开文件 `test.js`
2. 点击 🕒 "强制添加时间戳" 按钮
3. 验证：
   - [ ] 文件开头添加了时间戳注释
   - [ ] 显示成功消息
   - [ ] 控制台显示调试信息

#### 方法2：自动时间戳添加
1. 打开文件 `test.py`
2. 修改文件内容（添加一行注释）
3. 保存文件 (Cmd+S)
4. 验证：
   - [ ] 文件开头自动添加或更新时间戳
   - [ ] 插件面板中文件时间戳更新

#### 测试不同文件类型：
- [ ] JavaScript (.js) - test.js
- [ ] Python (.py) - test.py
- [ ] TypeScript (.ts) - app.ts
- [ ] Markdown (.md) - README.md
- [ ] YAML (.yml) - config.yml

### 第六步：测试Git功能 📦

#### 查看Git状态：
1. 在插件面板的"Git状态"视图中查看当前状态
2. 验证：
   - [ ] 显示当前分支
   - [ ] 显示修改的文件数量

#### 测试手动推送：
1. 点击 🔄 "推送到Git" 按钮
2. 观察控制台日志：
   - [ ] 显示提交信息
   - [ ] 显示推送过程

#### 测试强制推送：
1. 点击 🔄 "强制推送覆盖" 按钮
2. 验证：
   - [ ] 显示警告对话框
   - [ ] 需要确认才能执行
   - [ ] 显示强制推送成功消息

### 第七步：测试文件忽略功能 🚫

1. 创建被忽略的文件：
   ```bash
   echo "test content" > ~/test-timestamp-plugin/project-a/temp/test.log
   ```
2. 验证：
   - [ ] 被忽略的文件不出现在插件列表中
   - [ ] 被忽略的文件不会添加时间戳

### 第八步：性能测试 ⚡

1. 创建多个文件并快速修改
2. 验证：
   - [ ] 插件响应及时
   - [ ] 没有崩溃或错误
   - [ ] 内存使用正常

## 🐛 故障排除

### 开发者控制台调试
按 `Cmd+Shift+P` → "Developer: Toggle Developer Tools" → Console标签

**查找关键日志**：
```
Timestamp Tracker 插件已激活
自动提交配置 - 启用: true, 间隔: XX 秒
当前工作区: project-name
addTimestamp 被调用，文件: /path/to/file
文件支持注释，正在更新时间戳注释
```

### 常见问题解决
1. **插件图标不显示**：
   - 重启VSCode
   - 检查插件是否正确安装

2. **时间戳不添加**：
   - 使用强制添加按钮测试
   - 检查文件类型是否支持
   - 查看控制台错误信息

3. **配置不独立**：
   - 检查工作区配置文件
   - 确认在工作区设置而非用户设置

4. **Git操作失败**：
   - 检查Git仓库初始化
   - 检查网络连接
   - 查看错误消息

## 📊 测试结果记录

### 功能测试结果
- [ ] 插件加载 ✅/❌
- [ ] 多工作区配置 ✅/❌
- [ ] 时间戳添加 ✅/❌
- [ ] Git操作 ✅/❌
- [ ] 文件忽略 ✅/❌

### 发现的问题
(记录测试中发现的问题)

### 测试总结
(测试完成后的总体评价)

---
**测试时间**: $(date)
**测试人员**: Claude & User
**插件版本**: v0.1.8
**测试环境**: macOS, VSCode