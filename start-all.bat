@echo off
title Starting StockPro System...
cd /d "%~dp0"

echo ========================================================
echo   Starting StockPro Inventory and Sales Management
echo ========================================================
echo.

:: 1. Start XAMPP MySQL (if present)
if exist "C:\xampp\mysql_start.bat" (
    echo [1/3] Ensuring MySQL database is running...
    start "MySQL Service" /min cmd /c "C:\xampp\mysql_start.bat"
    ping 127.0.0.1 -n 3 >nul
) else (
    echo [1/3] Skipping XAMPP MySQL check.
)

:: 2. Start Laravel Backend (port 8000)
echo [2/3] Starting Backend API Server (port 8000)...
start "StockPro Backend" /min "%~dp0backend\start-backend.bat"

:: 3. Start React Frontend (port 3000)
echo [3/3] Starting Frontend App (port 3000)...
start "StockPro Frontend" /min "%~dp0frontend\start-frontend.bat"

echo.
echo ========================================================
echo   StockPro is starting in minimized windows!
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:3000
echo ========================================================
ping 127.0.0.1 -n 3 >nul
