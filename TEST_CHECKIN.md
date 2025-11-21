# Daily Check-in 功能测试指南

## 📋 测试前准备

1. **确保数据库迁移已完成**
   ```bash
   pnpm db:push
   # 或
   pnpm db:migrate:deploy
   ```

2. **启动开发服务器**
   ```bash
   pnpm dev
   ```

3. **登录账户**
   - 访问 http://localhost:3000
   - 使用测试账户登录（例如：jefflee2002@gmail.com）

## 🧪 测试步骤

### 1. 基础签到功能测试

1. **访问图片生成页面**
   - 导航到 `/image-generation` 或 `/video-generation`
   - 确认页面顶部显示 "Daily Check-In" 组件

2. **检查组件显示**
   - ✅ 显示当前积分余额（右上角紫色徽章）
   - ✅ 显示当前连续签到天数（橙色卡片，带火焰图标）
   - ✅ 显示 7 天奖励进度条
   - ✅ 显示最近 7 天的日历
   - ✅ 显示 "Check In Today (+2 Credits)" 按钮

3. **执行签到**
   - 点击 "Check In Today" 按钮
   - 应该看到成功 toast 通知
   - 积分余额应该增加 2 积分
   - 连续签到天数应该变为 1
   - 今天的日期在日历中应该显示为已签到（紫色圆圈带 ✓）

### 2. 重复签到测试

1. **尝试再次签到**
   - 点击 "Check In Today" 按钮
   - 应该显示错误提示："Already checked in today"
   - 按钮应该变为禁用状态："Already Checked In Today"

### 3. 连续签到测试

1. **模拟连续签到**（需要修改数据库或等待第二天）
   - 连续签到 2-3 天
   - 验证连续签到天数正确增加
   - 验证进度条正确更新

### 4. 7 天奖励测试

1. **连续签到 7 天**
   - 第 7 天签到应该获得额外 5 积分奖励
   - 总共应该获得 7 积分（2 + 5）
   - 应该看到成功消息包含 "bonus credits"
   - 进度条应该显示 100%

### 5. 积分余额更新测试

1. **验证积分更新**
   - 签到前记录积分余额
   - 执行签到
   - 刷新页面或检查 dashboard
   - 验证积分余额增加了正确的数量

### 6. 日历显示测试

1. **验证日历正确显示**
   - 已签到的日期应该显示紫色圆圈带 ✓
   - 今天的日期应该显示紫色边框（如果未签到）
   - 过去的日期应该显示灰色边框（如果未签到）

## 🔍 API 测试

### 使用浏览器 DevTools

1. **打开 Network 标签**
   - F12 打开开发者工具
   - 切换到 Network 标签

2. **测试 GET 请求**
   - 刷新页面
   - 查找 `GET /api/rewards/checkin` 请求
   - 检查响应：
     ```json
     {
       "success": true,
       "data": {
         "checkedInToday": false,
         "consecutiveDays": 0,
         "todayCheckin": null,
         "lastCheckin": null,
         "recentCheckins": []
       }
     }
     ```

3. **测试 POST 请求**
   - 点击 "Check In Today" 按钮
   - 查找 `POST /api/rewards/checkin` 请求
   - 检查响应：
     ```json
     {
       "success": true,
       "data": {
         "checkinId": "...",
         "checkinDate": "2025-01-XX",
         "consecutiveDays": 1,
         "creditsEarned": 2,
         "weeklyBonusEarned": false
       }
     }
     ```

### 使用命令行测试脚本

```bash
# 运行测试脚本（需要设置 TEST_USER_ID）
pnpm tsx scripts/test-checkin.ts
```

## ✅ 预期结果

### 首次签到
- ✅ 获得 2 积分
- ✅ 连续签到天数 = 1
- ✅ 进度条显示 1/7
- ✅ 积分余额增加 2

### 连续签到第 7 天
- ✅ 获得 7 积分（2 + 5 奖励）
- ✅ 连续签到天数 = 7
- ✅ 进度条显示 100%
- ✅ 显示 "Weekly bonus earned" 消息

### 重复签到
- ✅ 显示错误："Already checked in today"
- ✅ 按钮禁用
- ✅ 积分不增加

## 🐛 常见问题排查

1. **组件不显示**
   - 检查是否已登录
   - 检查浏览器控制台是否有错误
   - 检查 API 响应是否正常

2. **签到失败**
   - 检查网络请求是否成功
   - 检查服务器日志是否有错误
   - 检查数据库连接是否正常

3. **积分未更新**
   - 检查 creditService.earnCredits 是否成功执行
   - 检查数据库事务是否提交
   - 刷新页面查看最新余额

4. **日历不显示历史签到**
   - 检查 GET API 是否返回 recentCheckins
   - 检查日期格式是否正确（YYYY-MM-DD）

## 📊 数据库验证

可以直接查询数据库验证签到记录：

```sql
-- 查看用户的签到记录
SELECT * FROM user_daily_checkin 
WHERE user_id = 'your-user-id' 
ORDER BY checkin_date DESC;

-- 查看积分交易记录
SELECT * FROM credit_transactions 
WHERE user_id = 'your-user-id' 
AND source = 'checkin'
ORDER BY created_at DESC;
```

## 🎯 测试检查清单

- [ ] 组件正确显示在页面顶部
- [ ] 积分余额正确显示
- [ ] 首次签到成功并获得 2 积分
- [ ] 重复签到被阻止
- [ ] 连续签到天数正确计算
- [ ] 7 天奖励正确发放
- [ ] 日历正确显示签到历史
- [ ] Toast 通知正确显示
- [ ] 积分余额实时更新
- [ ] Dashboard 显示正确的积分余额

