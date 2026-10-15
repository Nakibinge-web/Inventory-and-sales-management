@echo off
cd /d "%~dp0"
set BROWSER=none
set PORT=3000
echo Starting StockPro Frontend on port 3000...
npm start
