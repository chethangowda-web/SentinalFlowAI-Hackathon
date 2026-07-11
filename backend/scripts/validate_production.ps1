Write-Host "=== STARTING PRODUCTION DEPLOYMENT VALIDATION PROBES ===" -ForegroundColor Cyan

# 1. Validate Health API
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/health/ready" -Method Get -ErrorAction Stop
    Write-Host " - Readiness Probe: Passed!" -ForegroundColor Green
    Write-Host "   Details: $res"
} catch {
    Write-Host " - Readiness Probe: FAILED! ($($_.Exception.Message))" -ForegroundColor Red
}

# 2. Validate Metrics Exporter
try {
    $res = Invoke-WebRequest -Uri "http://localhost:3000/metrics" -Method Get -ErrorAction Stop
    Write-Host " - Metrics Exporter Probe: Passed!" -ForegroundColor Green
} catch {
    Write-Host " - Metrics Exporter Probe: FAILED!" -ForegroundColor Red
}

Write-Host "=== VALIDATION COMPLETED ===" -ForegroundColor Cyan
