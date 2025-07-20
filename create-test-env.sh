#!/bin/bash

# 时间戳插件完整测试脚本
# 作者: Claude
# 版本: v1.0

echo "🚀 开始时间戳插件完整测试..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果记录
PASS=0
FAIL=0
TOTAL=0

# 测试函数
test_case() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    TOTAL=$((TOTAL + 1))
    
    if [ "$expected" = "$actual" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        echo -e "  期望: $expected"
        echo -e "  实际: $actual"
        FAIL=$((FAIL + 1))
    fi
}

# 创建测试项目A
echo -e "\n${BLUE}📁 创建测试项目A...${NC}"
mkdir -p ~/test-timestamp-plugin/project-a
cd ~/test-timestamp-plugin/project-a

# 初始化Git仓库
git init >/dev/null 2>&1
git config user.name "Test User"
git config user.email "test@example.com"

# 创建测试文件
cat > test.js << 'EOF'
// 这是一个JavaScript测试文件
function hello() {
    console.log("Hello from Project A");
}

module.exports = { hello };
EOF

cat > test.py << 'EOF'
# 这是一个Python测试文件
def hello():
    print("Hello from Project A")

if __name__ == "__main__":
    hello()
EOF

cat > README.md << 'EOF'
# 项目A测试

这是一个用于测试时间戳插件的项目A。

## 功能
- JavaScript测试
- Python测试
- Markdown测试
EOF

cat > .gitignore << 'EOF'
node_modules/
*.log
.DS_Store
temp/
EOF

# 创建被忽略的文件
mkdir -p temp
echo "这个文件应该被忽略" > temp/ignored.txt

echo -e "${GREEN}✓${NC} 项目A创建完成"

# 创建测试项目B
echo -e "\n${BLUE}📁 创建测试项目B...${NC}"
mkdir -p ~/test-timestamp-plugin/project-b
cd ~/test-timestamp-plugin/project-b

# 初始化Git仓库
git init >/dev/null 2>&1
git config user.name "Test User"
git config user.email "test@example.com"

# 创建测试文件
cat > app.ts << 'EOF'
// 这是一个TypeScript测试文件
interface User {
    name: string;
    email: string;
}

class UserService {
    private users: User[] = [];
    
    addUser(user: User): void {
        this.users.push(user);
        console.log("User added to Project B");
    }
}

export { UserService, User };
EOF

cat > config.yml << 'EOF'
# 项目B配置文件
project:
  name: "项目B测试"
  version: "1.0.0"
  
database:
  host: "localhost"
  port: 5432
  name: "test_db"

features:
  - timestamp_tracking
  - multi_workspace
  - git_integration
EOF

cat > README.md << 'EOF'
# 项目B测试

这是一个用于测试时间戳插件的项目B。

## 功能
- TypeScript测试
- YAML配置测试
- 多工作区测试
EOF

echo -e "${GREEN}✓${NC} 项目B创建完成"

# 创建VSCode工作区配置
echo -e "\n${BLUE}⚙️ 创建VSCode工作区配置...${NC}"

mkdir -p ~/test-timestamp-plugin/project-a/.vscode
cat > ~/test-timestamp-plugin/project-a/.vscode/settings.json << 'EOF'
{
    "timestampTracker.gitRepository": "https://github.com/test/project-a.git",
    "timestampTracker.enableAutoCommit": true,
    "timestampTracker.autoCommitInterval": 60,
    "timestampTracker.timestampFormat": "YYYY-MM-DD HH:mm:ss"
}
EOF

mkdir -p ~/test-timestamp-plugin/project-b/.vscode
cat > ~/test-timestamp-plugin/project-b/.vscode/settings.json << 'EOF'
{
    "timestampTracker.gitRepository": "https://github.com/test/project-b.git",
    "timestampTracker.enableAutoCommit": true,
    "timestampTracker.autoCommitInterval": 120,
    "timestampTracker.timestampFormat": "YYYY/MM/DD HH:mm:ss"
}
EOF

echo -e "${GREEN}✓${NC} 工作区配置创建完成"

# 创建测试报告模板
cat > ~/test-timestamp-plugin/test-report.md << 'EOF'
# 时间戳插件测试报告

## 测试环境
- VSCode版本: 检查中...
- 插件版本: v0.1.8
- 操作系统: macOS
- 测试时间: $(date)

## 测试项目
1. **项目A**: ~/test-timestamp-plugin/project-a
   - Git仓库: https://github.com/test/project-a.git
   - 自动提交间隔: 60秒
   - 测试文件: test.js, test.py, README.md

2. **项目B**: ~/test-timestamp-plugin/project-b
   - Git仓库: https://github.com/test/project-b.git
   - 自动提交间隔: 120秒
   - 测试文件: app.ts, config.yml, README.md

## 测试结果

### 1. 时间戳添加功能测试
- [ ] JavaScript文件 (test.js)
- [ ] Python文件 (test.py) 
- [ ] TypeScript文件 (app.ts)
- [ ] Markdown文件 (README.md)
- [ ] YAML文件 (config.yml)

### 2. 多工作区配置测试
- [ ] 项目A显示正确的Git仓库配置
- [ ] 项目B显示正确的Git仓库配置
- [ ] 配置相互独立，互不影响

### 3. Git操作测试
- [ ] 自动提交功能
- [ ] 强制推送功能
- [ ] .gitignore文件遵循

### 4. 插件界面测试
- [ ] 活动栏图标显示
- [ ] 文件时间戳列表显示
- [ ] 工具栏按钮功能

## 问题记录
(在此记录发现的问题)

## 测试总结
(测试完成后填写)
EOF

echo -e "\n${GREEN}🎉 测试环境创建完成！${NC}"
echo -e "\n${YELLOW}📋 测试项目位置:${NC}"
echo -e "  项目A: ~/test-timestamp-plugin/project-a"
echo -e "  项目B: ~/test-timestamp-plugin/project-b"
echo -e "  测试报告: ~/test-timestamp-plugin/test-report.md"

echo -e "\n${YELLOW}📝 下一步操作:${NC}"
echo -e "  1. 安装插件: timestamp-tracker-0.1.8.vsix"
echo -e "  2. 用VSCode分别打开两个项目文件夹"
echo -e "  3. 运行测试命令: bash ~/test-timestamp-plugin/run-tests.sh"

# 显示测试统计
echo -e "\n${BLUE}📊 测试统计:${NC}"
echo -e "  总计: $TOTAL"
echo -e "  通过: ${GREEN}$PASS${NC}"
echo -e "  失败: ${RED}$FAIL${NC}"