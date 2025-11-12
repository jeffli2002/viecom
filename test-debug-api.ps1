# Test Debug API
Write-Host "`n🔬 Testing Debug API..." -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

$headers = @{
    "Cookie" = "admin_token=eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjYzMjIzNTI3LTIwMzktNDQ1OC04Y2NmLWFjYTZjMDJmZjFmOSIsImVtYWlsIjoiYWRtaW5AdmllY29tLnBybyIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc2NTUzNTM4Nn0.teJFRVSNADqrsILHxVychuKrs_KZDqKTmvfARHYLhCE"
}

try {
    $response = Invoke-WebRequest -Uri "https://www.viecom.pro/api/admin/dashboard/test-stats" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`n📊 Response:" -ForegroundColor Yellow
    $data = $response.Content | ConvertFrom-Json
    $data | ConvertTo-Json -Depth 10
    
    if ($data.hasErrors) {
        Write-Host "`n⚠️  Some queries failed! Check errors above." -ForegroundColor Yellow
    } else {
        Write-Host "`n✅ All queries successful!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "`n📋 Error:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Red
    }
}

Write-Host "`n==========================================`n" -ForegroundColor Cyan

