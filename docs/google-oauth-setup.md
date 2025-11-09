# Google OAuth Redirect URL 设置指南

## 当前配置

项目中的 Google OAuth redirect URL 配置在 `src/lib/auth/auth.ts` 中：

```typescript
redirectURI: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
```

这意味着 redirect URL 会根据 `NEXT_PUBLIC_APP_URL` 环境变量自动生成。

## 设置步骤

### 1. 在 Google Cloud Console 中设置 Redirect URI

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目（或创建新项目）
3. 进入 **APIs & Services** > **Credentials**
4. 找到你的 OAuth 2.0 Client ID（或创建新的）
5. 在 **Authorized redirect URIs** 部分，添加以下 URL：

#### 开发环境（本地）
```
http://localhost:3000/api/auth/callback/google
```

#### 生产环境
```
https://your-domain.com/api/auth/callback/google
```

**注意：** 如果你的应用支持多个环境（开发、测试、生产），需要添加所有环境的 redirect URI。

### 2. 配置环境变量

在 `.env.local` 文件中设置：

```bash
# 开发环境
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 生产环境
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 3. 获取 Google OAuth 凭据

1. 在 Google Cloud Console 中创建 OAuth 2.0 Client ID
2. 复制 **Client ID** 和 **Client Secret**
3. 在 `.env.local` 中设置：

```bash
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 重要提示

1. **Redirect URI 必须完全匹配**
   - Google 会严格验证 redirect URI
   - 必须包含完整的协议（http/https）
   - 必须包含完整的路径：`/api/auth/callback/google`
   - 不能有尾随斜杠

2. **多个环境需要多个 URI**
   - 开发环境：`http://localhost:3000/api/auth/callback/google`
   - 测试环境：`https://staging.your-domain.com/api/auth/callback/google`
   - 生产环境：`https://your-domain.com/api/auth/callback/google`

3. **本地开发时的端口**
   - 如果使用不同的端口（如 3001），需要相应更新 redirect URI
   - 确保 `NEXT_PUBLIC_APP_URL` 与 Google Console 中的 URI 一致

4. **HTTPS 要求**
   - 生产环境必须使用 HTTPS
   - Google 不允许在生产环境使用 HTTP

## 验证配置

配置完成后，可以通过以下方式验证：

1. 访问登录页面
2. 点击 "Sign in with Google" 按钮
3. 应该能正常跳转到 Google 登录页面
4. 登录成功后应该能正确返回到应用

## 常见问题

### 问题：`redirect_uri_mismatch` 错误

**原因：** Google Console 中的 redirect URI 与应用配置不匹配

**解决方案：**
1. 检查 `NEXT_PUBLIC_APP_URL` 环境变量
2. 确保 Google Console 中的 URI 完全匹配：`${NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
3. 注意协议（http/https）和端口号

### 问题：本地开发无法使用 Google OAuth

**原因：** Google 可能不允许 localhost 的某些配置

**解决方案：**
1. 确保在 Google Console 中添加了 `http://localhost:3000/api/auth/callback/google`
2. 检查 OAuth 同意屏幕是否已配置
3. 确保应用状态为 "Testing" 或 "In production"

## 参考链接

- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Better Auth 文档](https://www.better-auth.com/docs)



