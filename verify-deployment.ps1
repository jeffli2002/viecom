# Verify latest deployment is live
Write-Host "`n🔍 Verifying Deployment Status..." -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

$token = "admin_token=eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjYzMjIzNTI3LTIwMzktNDQ1OC04Y2NmLWFjYTZjMDJmZjFmOSIsImVtYWlsIjoiYWRtaW5AdmllY29tLnBybyIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc2NTUzNTM4Nn0.teJFRVSNADqrsILHxVychuKrs_KZDqKTmvfARHYLhCE"

# Add random parameter to bust cache
$cacheBuster = (Get-Date).Ticks

Write-Host "📡 Testing Credits API with cache buster..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest `
        -Uri "https://www.viecom.pro/api/admin/credits/summary?range=today&_cb=$cacheBuster" `
        -Method GET `
        -Headers @{ 
            "Cookie" = $token
            "Cache-Control" = "no-cache, no-store, must-revalidate"
            "Pragma" = "no-cache"
        } `
        -UseBasicParsing
    
    Write-Host "✅ API Response: $($response.StatusCode)" -ForegroundColor Green
    
    # Check response headers
    Write-Host "`n📋 Response Headers:" -ForegroundColor Cyan
    Write-Host "   Cache-Control: $($response.Headers['Cache-Control'])" -ForegroundColor Yellow
    Write-Host "   Date: $($response.Headers['Date'])" -ForegroundColor Yellow
    Write-Host "   X-Vercel-Cache: $($response.Headers['X-Vercel-Cache'])" -ForegroundColor Yellow
    
    # Parse and display data
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "`n📊 Credits Summary:" -ForegroundColor Cyan
    Write-Host "   Total Consumed: $($data.summary.totalConsumed)" -ForegroundColor Green
    Write-Host "   Image Credits: $($data.summary.imageCredits)" -ForegroundColor Green
    Write-Host "   Video Credits: $($data.summary.videoCredits)" -ForegroundColor Green
    
    Write-Host "`n👥 Top 10 Users:" -ForegroundColor Cyan
    if ($data.top10Users.Count -eq 0) {
        Write-Host "   ⚠️  Empty (Count: 0)" -ForegroundColor Yellow
        Write-Host "`n   💡 This means the latest fix is NOT deployed yet!" -ForegroundColor Red
        Write-Host "   📝 Wait another 1-2 minutes and try again." -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Found $($data.top10Users.Count) users" -ForegroundColor Green
        $data.top10Users | ForEach-Object {
            Write-Host "      - $($_.email): Total=$($_.total_consumed), Image=$($_.image_credits), Video=$($_.video_credits)"
        }
        Write-Host "`n   🎉 Latest fix is DEPLOYED successfully!" -ForegroundColor Green
    }
    
    # Test with 7d range
    Write-Host "`n📡 Testing 7d range..." -ForegroundColor Yellow
    $response7d = Invoke-WebRequest `
        -Uri "https://www.viecom.pro/api/admin/credits/summary?range=7d&_cb=$cacheBuster" `
        -Method GET `
        -Headers @{ "Cookie" = $token } `
        -UseBasicParsing
    
    $data7d = $response7d.Content | ConvertFrom-Json
    Write-Host "   Total (7d): $($data7d.summary.totalConsumed)" -ForegroundColor Green
    Write-Host "   Top Users (7d): $($data7d.top10Users.Count) users" -ForegroundColor Green
    
    if ($data.summary.totalConsumed -eq $data7d.summary.totalConsumed) {
        Write-Host "`n   ℹ️  Same data for 'today' and '7d' - this is normal if all usage happened today" -ForegroundColor Cyan
    } else {
        Write-Host "`n   ✅ Data changes between time ranges - working correctly!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "`n📋 Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n==========================================`n" -ForegroundColor Cyan

