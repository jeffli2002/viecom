# Test Dashboard API after Vercel deployment
# Run this in PowerShell after deployment completes

Write-Host "`n🔍 Testing Dashboard API..." -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Test with admin_token
$headers = @{
    "Cookie" = "admin_token=eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjYzMjIzNTI3LTIwMzktNDQ1OC04Y2NmLWFjYTZjMDJmZjFmOSIsImVtYWlsIjoiYWRtaW5AdmllY29tLnBybyIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc2NTUzNTM4Nn0.teJFRVSNADqrsILHxVychuKrs_KZDqKTmvfARHYLhCE"
}

try {
    $response = Invoke-WebRequest -Uri "https://www.viecom.pro/api/admin/dashboard/stats?range=7d" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    Write-Host "✅ Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    Write-Host "`n📊 Response Data:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host "`n🎉 SUCCESS! Dashboard API is working!" -ForegroundColor Green
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Status: $statusCode" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "`n📋 Error Response:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Red
    }
    
    Write-Host "`n💡 Possible causes:" -ForegroundColor Yellow
    if ($statusCode -eq 500) {
        Write-Host "   1. Vercel deployment not completed yet - WAIT 1-2 minutes" -ForegroundColor Yellow
        Write-Host "   2. Check Vercel deployment status" -ForegroundColor Yellow
        Write-Host "   3. View Vercel Function Logs for detailed error" -ForegroundColor Yellow
    }
}

Write-Host "`n==========================================`n" -ForegroundColor Cyan

