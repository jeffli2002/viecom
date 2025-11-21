# 测试文档

本项目包含单元测试和 E2E 测试。

## 目录结构

```
tests/
├── unit/           # 单元测试 (Jest)
│   ├── credit-service.test.ts
│   └── plan-utils.test.ts
└── e2e/            # E2E 测试 (Playwright)
    ├── playwright.config.ts
    ├── homepage.spec.ts
    ├── pricing.spec.ts
    └── auth.spec.ts
```

## 运行测试

### 运行所有测试

```bash
pnpm test:all
```

### 运行单元测试

```bash
# 运行所有单元测试
pnpm test:unit

# 运行所有测试（包括单元测试）
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage
```

### 运行 E2E 测试

```bash
# 运行 E2E 测试
pnpm test:e2e

# 运行 E2E 测试（带 UI）
pnpm test:e2e:ui

# 运行 E2E 测试（headed 模式，显示浏览器）
pnpm test:e2e:headed
```

## 测试说明

### 单元测试

单元测试使用 Jest 框架，测试核心业务逻辑：

- **credit-service.test.ts**: 测试积分服务的核心功能
  - 积分获取（earnCredits）
  - 积分消费（spendCredits）
  - 积分余额检查（hasEnoughCredits）

- **plan-utils.test.ts**: 测试计划工具函数
  - 计划解析（resolvePlanByIdentifier）
  - 积分计算（getCreditsForPlan）
  - 计划名称格式化（formatPlanName）

### E2E 测试

E2E 测试使用 Playwright 框架，测试用户界面和交互：

- **homepage.spec.ts**: 测试首页功能
  - 页面加载
  - 导航菜单显示
  - 登录/注册按钮

- **pricing.spec.ts**: 测试定价页面
  - 页面加载
  - 定价计划显示
  - Free 和 Pro 计划显示

- **auth.spec.ts**: 测试认证流程
  - 登录页面导航
  - 注册页面导航

## 配置

### Jest 配置

Jest 配置文件：`jest.config.mjs`

- 测试环境：`jsdom`
- 路径别名：`@/` 映射到 `src/`
- 忽略目录：`.next/`, `AI Image_Video Generator/`, `FigmaMockup/`

### Playwright 配置

Playwright 配置文件：`tests/e2e/playwright.config.ts`

- 基础 URL：`http://localhost:3000`（可通过 `PLAYWRIGHT_TEST_BASE_URL` 环境变量覆盖）
- 自动启动开发服务器
- 支持 Chromium、Firefox、WebKit 浏览器

## 环境变量

E2E 测试可以使用以下环境变量：

- `PLAYWRIGHT_TEST_BASE_URL`: 覆盖默认的基础 URL（默认：`http://localhost:3000`）
- `CI`: 在 CI 环境中自动设置重试次数和并行度

## 注意事项

1. **数据库 Mock**: 单元测试使用 Jest mock 来模拟数据库操作，不会影响实际数据库
2. **开发服务器**: E2E 测试会自动启动开发服务器，确保在运行测试前端口 3000 未被占用
3. **测试数据**: E2E 测试使用真实的应用环境，但不会修改生产数据
4. **浏览器**: Playwright 会自动下载所需的浏览器，首次运行可能需要一些时间

## 添加新测试

### 添加单元测试

在 `tests/unit/` 目录下创建新的 `.test.ts` 文件：

```typescript
import { describe, it, expect } from '@jest/globals';

describe('MyFeature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

### 添加 E2E 测试

在 `tests/e2e/` 目录下创建新的 `.spec.ts` 文件：

```typescript
import { test, expect } from '@playwright/test';

test.describe('MyFeature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/my-feature');
    await expect(page).toHaveTitle(/My Feature/i);
  });
});
```

## 故障排除

### 测试失败

1. 确保开发服务器正在运行（E2E 测试）
2. 检查端口 3000 是否被占用
3. 运行 `pnpm install` 确保所有依赖已安装
4. 对于 Playwright，运行 `npx playwright install` 安装浏览器

### 单元测试 Mock 问题

如果遇到 mock 相关的问题，检查：
1. Mock 是否正确设置
2. 导入路径是否正确
3. 测试环境配置是否正确

