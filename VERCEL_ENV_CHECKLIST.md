# Vercel Environment Variables Checklist

## 🚨 CRITICAL - Admin Login Fix

访问：https://vercel.com/your-username/viecom/settings/environment-variables

### ✅ 必须设置的环境变量

检查以下变量是否存在：

- [ ] `DATABASE_URL` - 数据库连接字符串
- [ ] `BETTER_AUTH_SECRET` - 用户认证密钥
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth
- [ ] `KIE_API_KEY` - AI 生成 API
- [ ] `NEXT_PUBLIC_APP_URL` - 应用 URL (https://www.viecom.pro)
- [ ] **`ADMIN_JWT_SECRET`** - **管理员 JWT 密钥（最重要！）**

### 🔑 ADMIN_JWT_SECRET 设置

如果 `ADMIN_JWT_SECRET` 不存在或为空：

1. 点击 "Add New"
2. Name: `ADMIN_JWT_SECRET`
3. Value: `7SK/V+UVLCE+xTlvGBoAuwXpxcW/k62o0LBWdLWDKnA=`
4. Environment: 选择 **Production**, **Preview**, **Development**
5. 点击 "Save"

### ⚠️ 设置后必须重新部署

1. 访问：https://vercel.com/your-username/viecom/deployments
2. 点击最新部署的 "•••" 菜单
3. 选择 "Redeploy"
4. 等待 2-3 分钟

### 🔍 验证环境变量是否生效

重新部署后，访问以下 URL 测试：

```bash
curl -X POST https://www.viecom.pro/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@viecom.pro","password":"admin123456","remember":false}'
```

**期望结果：**
- ✅ 返回 200 OK
- ✅ 响应包含 `"success": true`
- ✅ 设置 `admin_token` cookie

**如果仍然失败：**
- ❌ 检查 Vercel Function Logs
- ❌ 确认环境变量已保存
- ❌ 确认已重新部署

---

## 📝 完整环境变量列表

```bash
# Required
NEXT_PUBLIC_APP_URL=https://www.viecom.pro
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=tldcpbUs5Js3Dj9sf0vJY1ld2KAzxe4piTMAqoKMO1o=
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
KIE_API_KEY=...

# Admin (Critical for /admin/*)
ADMIN_JWT_SECRET=7SK/V+UVLCE+xTlvGBoAuwXpxcW/k62o0LBWdLWDKnA=
```

