# 开发服务器启动脚本
Write-Host "正在启动开发服务器..." -ForegroundColor Cyan
Write-Host "端口: 3000" -ForegroundColor Cyan
Write-Host "访问地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# 设置端口环境变量
$env:PORT = "3000"

# 启动开发服务器
pnpm dev

