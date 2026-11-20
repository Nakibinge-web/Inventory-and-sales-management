@echo off
cd /d D:\sem4_project\backend
start /B php artisan queue:work --sleep=2 --tries=3 --timeout=90
php artisan serve --host=127.0.0.1 --port=8000
