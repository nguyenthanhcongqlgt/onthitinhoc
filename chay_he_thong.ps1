$scriptPath = $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  HE THONG KIEM TRA TRUC TUYEN - THPT QUAT LAM" -ForegroundColor Yellow
Write-Host "  Dang khoi dong Backend Django va Frontend React..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[*] 1. Khoi dong Backend Django API (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath\backend'; python manage.py runserver 8000"

Write-Host "[*] 2. Khoi dong Frontend React (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath\frontend'; npm.cmd run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [+] DA KHOI DONG THANH CONG CA 2 SERVER!" -ForegroundColor Green
Write-Host "  [i] Giao dien thi: http://localhost:5173/" -ForegroundColor Yellow
Write-Host "  [i] Admin Backend: http://127.0.0.1:8000/admin/" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 3
