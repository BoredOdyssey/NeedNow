# NeedNow Marketplace — PowerShell Startup
# Usage: Right-click > Run with PowerShell  OR  .\start.ps1

$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$node22 = "C:\NVM\nvm\v22.11.0\node.exe"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  NeedNow Marketplace | Hyperlocal Reverse-Bidding Market" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting backend API server on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; node server\server.js"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting frontend dev server on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; & '$node22' node_modules\vite\bin\vite.js"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  DONE! Open your browser at: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Demo logins (password: Password123):" -ForegroundColor White
Write-Host "    Requester : ananya@example.com" -ForegroundColor White
Write-Host "    Provider  : ravi@example.com" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""
