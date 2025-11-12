# Test Credits Debug API
Write-Host "`n🔬 Testing Credits Debug API..." -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

$headers = @{
    "Cookie" = "admin_token=eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjYzMjIzNTI3LTIwMzktNDQ1OC04Y2NmLWFjYTZjMDJmZjFmOSIsImVtYWlsIjoiYWRtaW5AdmllY29tLnBybyIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc2NTUzNTM4Nn0.teJFRVSNADqrsILHxVychuKrs_KZDqKTmvfARHYLhCE"
}

try {
    $response = Invoke-WebRequest -Uri "https://www.viecom.pro/api/admin/credits/debug" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`n📊 Debug Data:" -ForegroundColor Yellow
    
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "`n=== All Transactions ===" -ForegroundColor Cyan
    $data.allTransactions | Format-Table -AutoSize
    
    Write-Host "`n=== Users With Transactions ===" -ForegroundColor Cyan
    $data.usersWithTransactions | Format-Table -AutoSize
    
    Write-Host "`n=== Top 10 Test ===" -ForegroundColor Cyan
    $data.top10Test | Format-Table -AutoSize
    
    Write-Host "`n=== Total Consumed By Type/Source ===" -ForegroundColor Cyan
    $data.totalConsumed | Format-Table -AutoSize
    
    Write-Host "`n✅ Debug data retrieved successfully!" -ForegroundColor Green
    Write-Host "Check the data above to understand why Top 10 is empty." -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n==========================================`n" -ForegroundColor Cyan

