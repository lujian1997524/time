// Test file to verify timestamp fix
/**
 * 最后修改时间: 2025-07-20 09:31:39
 * 上次修改时间: 2025-07-20 09:29:28
 * 文件大小: 2087 bytes
 */

interface TimestampTest {
    id: number;
    description: string;
    created: Date;
    lastUpdated?: Date;
}

class TimestampTester {
    private tests: TimestampTest[] = [];
    
    constructor() {
        console.log("TimestampTester 初始化完成 - 测试时间戳修复");
        console.log("测试上次修改时间是否正确保存");
    }
    
    addTest(description: string): TimestampTest {
        const test: TimestampTest = {
            id: this.tests.length + 1,
            description,
            created: new Date()
        };
        
        this.tests.push(test);
        console.log(`添加测试: ${description}`);
        return test;
    }
    
    updateTest(id: number, description: string): boolean {
        const test = this.tests.find(t => t.id === id);
        if (test) {
            test.description = description;
            test.lastUpdated = new Date();
            console.log(`更新测试 ${id}: ${description}`);
            return true;
        }
        return false;
    }
    
    getTests(): TimestampTest[] {
        return this.tests;
    }
    
    printTestReport(): void {
        console.log("=== 时间戳测试报告 ===");
        this.tests.forEach(test => {
            console.log(`测试 ${test.id}: ${test.description}`);
            console.log(`创建时间: ${test.created.toISOString()}`);
            if (test.lastUpdated) {
                console.log(`更新时间: ${test.lastUpdated.toISOString()}`);
            }
        });
    }
    
    // 新增功能：批量处理测试
    processBatchTests(): void {
        console.log("开始批量处理测试...");
        this.addTest("批量测试1");
        this.addTest("批量测试2");
        this.addTest("批量测试3");
    }
}

export { TimestampTester, TimestampTest };