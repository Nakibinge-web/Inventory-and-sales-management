@echo off
echo Starting Laravel Backend Server...
start /B "Laravel Backend" cmd /c "cd /d D:\sem4_project\backend && php artisan serve --host=127.0.0.1 --port=8000"

echo Starting Nginx Server...
start /B "Nginx" cmd /c "cd /d D:\nginx-1.30.4 && nginx.exe"

echo All services started!
echo Laravel Backend: http://localhost:8000
echo Frontend (Nginx): http://localhost:81
pause
