@echo off
title HE THONG KIEM TRA HSG THPT QUAT LAM
cls
echo ========================================================
echo   HE THONG KIEM TRA TRUC TUYEN - THPT QUAT LAM
echo   Dang khoi dong Backend Django va Frontend React...
echo ========================================================
echo.

set "APP_DIR=%~dp0"

echo [*] 1. Khoi dong Backend Django API (Port 8000)...
start "Backend Django API" cmd /k "cd /d "%APP_DIR%backend" && python manage.py runserver 8000"

echo [*] 2. Khoi dong Frontend React (Port 5173)...
start "Frontend React" cmd /k "cd /d "%APP_DIR%frontend" && npm run dev"

echo.
echo ========================================================
echo   [+] DA KHOI DONG THANH CONG CA 2 SERVER!
echo   [i] Giao dien thi: http://localhost:5173/
echo   [i] Admin Backend: http://127.0.0.1:8000/admin/
echo ========================================================
echo.
pause
