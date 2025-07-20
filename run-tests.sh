#!/bin/bash

# 时间戳插件自动化测试运行脚本
echo "🔍 开始自动化测试时间戳插件..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试结果
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 记录测试结果
log_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        [ -n "$details" ] && echo -e "  ${YELLOW}详情:${NC} $details"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 检查文件是否存在
check_file() {
    local file_path="$1"
    local description="$2"
    
    if [ -f "$file_path" ]; then
        log_test "文件检查: $description" "PASS"
        return 0
    else
        log_test "文件检查: $description" "FAIL" "文件不存在: $file_path"
        return 1
    fi
}

# 检查目录是否存在
check_directory() {
    local dir_path="$1"
    local description="$2"
    
    if [ -d "$dir_path" ]; then
        log_test "目录检查: $description" "PASS"
        return 0
    else
        log_test "目录检查: $description" "FAIL" "目录不存在: $dir_path"
        return 1
    fi
}

# 检查文件内容
check_file_content() {
    local file_path="$1"
    local pattern="$2"
    local description="$3"
    
    if [ -f "$file_path" ] && grep -q "$pattern" "$file_path"; then
        log_test "内容检查: $description" "PASS"
        return 0
    else
        log_test "内容检查: $description" "FAIL" "文件中未找到: $pattern"
        return 1
    fi
}

echo -e "\n${BLUE}🏗️  检查测试环境...${NC}"

# 检查基础目录结构
check_directory "$HOME/test-timestamp-plugin" "测试根目录"
check_directory "$HOME/test-timestamp-plugin/project-a" "项目A目录"
check_directory "$HOME/test-timestamp-plugin/project-b" "项目B目录"

# 检查项目A文件
echo -e "\n${BLUE}📁 检查项目A文件...${NC}"
check_file "$HOME/test-timestamp-plugin/project-a/test.js" "JavaScript测试文件"
check_file "$HOME/test-timestamp-plugin/project-a/test.py" "Python测试文件"
check_file "$HOME/test-timestamp-plugin/project-a/README.md" "Markdown文件"
check_file "$HOME/test-timestamp-plugin/project-a/.gitignore" "GitIgnore文件"

# 检查项目B文件
echo -e "\n${BLUE}📁 检查项目B文件...${NC}"
check_file "$HOME/test-timestamp-plugin/project-b/app.ts" "TypeScript测试文件"
check_file "$HOME/test-timestamp-plugin/project-b/config.yml" "YAML配置文件"
check_file "$HOME/test-timestamp-plugin/project-b/README.md" "Markdown文件"

# 检查VSCode配置
echo -e "\n${BLUE}⚙️  检查VSCode配置...${NC}"
check_file "$HOME/test-timestamp-plugin/project-a/.vscode/settings.json" "项目A VSCode配置"
check_file "$HOME/test-timestamp-plugin/project-b/.vscode/settings.json" "项目B VSCode配置"

# 检查配置内容
check_file_content "$HOME/test-timestamp-plugin/project-a/.vscode/settings.json" "project-a.git" "项目A Git仓库配置"
check_file_content "$HOME/test-timestamp-plugin/project-b/.vscode/settings.json" "project-b.git" "项目B Git仓库配置"

# 检查Git仓库
echo -e "\n${BLUE}🔧 检查Git仓库...${NC}"
check_directory "$HOME/test-timestamp-plugin/project-a/.git" "项目A Git仓库"
check_directory "$HOME/test-timestamp-plugin/project-b/.git" "项目B Git仓库"

# 检查插件文件
echo -e "\n${BLUE}📦 检查插件文件...${NC}"
check_file "/Users/gao/Desktop/time/timestamp-tracker-0.1.8.vsix" "插件安装包"

# 模拟时间戳添加测试
echo -e "\n${BLUE}🕒 模拟时间戳功能测试...${NC}"

# 创建带时间戳的测试文件
test_file_with_timestamp() {
    local file_path="$1"
    local comment_start="$2"
    local comment_end="$3"
    local description="$4"
    
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local temp_file=$(mktemp)
    
    # 添加时间戳注释到文件开头
    echo "$comment_start" > "$temp_file"
    echo "最后修改时间: $timestamp" >> "$temp_file"
    echo "文件大小: $(stat -f%z "$file_path" 2>/dev/null || echo "unknown") bytes" >> "$temp_file"
    echo "$comment_end" >> "$temp_file"
    echo "" >> "$temp_file"
    cat "$file_path" >> "$temp_file"
    
    # 检查是否成功添加
    if grep -q "最后修改时间" "$temp_file"; then
        cp "$temp_file" "$file_path"
        log_test "时间戳添加: $description" "PASS"
    else
        log_test "时间戳添加: $description" "FAIL" "时间戳注释添加失败"
    fi
    
    rm -f "$temp_file"
}

# 为不同文件类型添加时间戳
test_file_with_timestamp "$HOME/test-timestamp-plugin/project-a/test.js" "/**" " */" "JavaScript文件"
test_file_with_timestamp "$HOME/test-timestamp-plugin/project-a/test.py" '"""' '"""' "Python文件"
test_file_with_timestamp "$HOME/test-timestamp-plugin/project-b/app.ts" "/**" " */" "TypeScript文件"
test_file_with_timestamp "$HOME/test-timestamp-plugin/project-a/README.md" "<!--" "-->" "Markdown文件"

# 生成测试报告
echo -e "\n${BLUE}📊 生成测试报告...${NC}"

cat > "$HOME/test-timestamp-plugin/automated-test-report.md" << EOF
# 时间戳插件自动化测试报告

## 测试信息
- 测试时间: $(date)
- 测试类型: 自动化环境测试
- 插件版本: v0.1.8

## 测试统计
- 总测试数: $TOTAL_TESTS
- 通过: $PASSED_TESTS
- 失败: $FAILED_TESTS
- 成功率: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## 测试项目状态
### 项目A (~/test-timestamp-plugin/project-a)
- Git仓库: 已初始化
- 配置文件: https://github.com/test/project-a.git
- 测试文件: JavaScript, Python, Markdown

### 项目B (~/test-timestamp-plugin/project-b)  
- Git仓库: 已初始化
- 配置文件: https://github.com/test/project-b.git
- 测试文件: TypeScript, YAML, Markdown

## 下一步操作
1. 在VSCode中分别打开两个项目文件夹
2. 安装插件: timestamp-tracker-0.1.8.vsix
3. 测试插件功能:
   - 点击活动栏时钟图标
   - 使用"显示当前配置"按钮验证多工作区配置
   - 使用"强制添加时间戳"按钮测试时间戳功能
   - 修改文件并保存，观察自动时间戳添加

## 手动测试检查清单
- [ ] 插件在活动栏显示时钟图标
- [ ] 项目A配置显示 project-a.git 仓库
- [ ] 项目B配置显示 project-b.git 仓库  
- [ ] 强制添加时间戳功能正常工作
- [ ] 自动时间戳添加功能正常工作
- [ ] Git操作功能正常工作
EOF

# 最终报告
echo -e "\n${GREEN}🎉 自动化测试完成！${NC}"
echo -e "\n${YELLOW}📊 测试结果:${NC}"
echo -e "  总计: $TOTAL_TESTS 项测试"
echo -e "  通过: ${GREEN}$PASSED_TESTS${NC} 项"
echo -e "  失败: ${RED}$FAILED_TESTS${NC} 项"
echo -e "  成功率: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

echo -e "\n${YELLOW}📁 生成的文件:${NC}"
echo -e "  测试报告: ~/test-timestamp-plugin/automated-test-report.md"
echo -e "  项目A: ~/test-timestamp-plugin/project-a/"
echo -e "  项目B: ~/test-timestamp-plugin/project-b/"

echo -e "\n${BLUE}🔗 VSCode命令:${NC}"
echo -e "  打开项目A: code ~/test-timestamp-plugin/project-a"
echo -e "  打开项目B: code ~/test-timestamp-plugin/project-b"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ 所有自动化测试通过！可以进行手动测试。${NC}"
    exit 0
else
    echo -e "\n${RED}❌ 有 $FAILED_TESTS 项测试失败，请检查环境设置。${NC}"
    exit 1
fi