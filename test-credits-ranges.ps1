# Test Credits API with different time ranges
Write-Host "`n🧪 Testing Credits API with different time ranges..." -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

$token = "admin_token=eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjYzMjIzNTI3LTIwMzktNDQ1OC04Y2NmLWFjYTZjMDJmZjFmOSIsImVtYWlsIjoiYWRtaW5AdmllY29tLnBybyIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc2NTUzNTM4Nn0.teJFRVSNADqrsILHxVychuKrs_KZDqKTmvfARHYLhCE"

$ranges = @('today', '7d', '30d', '90d')

foreach ($range in $ranges) {
    Write-Host "`n📅 Testing: $range" -ForegroundColor Yellow
    Write-Host "-" * 40
    
    try {
        $response = Invoke-WebRequest `
            -Uri "https://www.viecom.pro/api/admin/credits/summary?range=$range&_t=$(Get-Date -UFormat %s)" `
            -Method GET `
            -Headers @{ "Cookie" = $token } `
            -UseBasicParsing
        
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "✅ Total Credits: $($data.summary.totalConsumed)" -ForegroundColor Green
        Write-Host "   Image Credits: $($data.summary.imageCredits)"
        Write-Host "   Video Credits: $($data.summary.videoCredits)"
        Write-Host "   Top 10 Users Count: $($data.top10Users.Count)"
        
        if ($data.top10Users.Count -gt 0) {
            Write-Host "`n   Top User: $($data.top10Users[0].email) - $($data.top10Users[0].total_consumed) credits"
        } else {
            Write-Host "`n   ⚠️  No users in Top 10" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n==========================================`n" -ForegroundColor Cyan
Write-Host "💡 If all ranges show the same data, there might be:" -ForegroundColor Yellow
Write-Host "   1. Browser cache issue - Press Ctrl+Shift+R to hard refresh" -ForegroundColor Yellow
Write-Host "   2. Vercel edge cache - Wait 1-2 minutes for cache to clear" -ForegroundColor Yellow
Write-Host "   3. All consumption happened in the same time period" -ForegroundColor Yellow

