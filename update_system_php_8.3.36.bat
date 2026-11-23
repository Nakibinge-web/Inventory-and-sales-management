@echo off
:: ISMS - One-Click System PHP 8.3.36 Activator
:: Self-elevates to update HKLM Windows Machine PATH

echo Checking administrative privileges...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Elevating to Administrator...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo Updating Windows System PATH to PHP 8.3.36...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path /t REG_EXPAND_SZ /d "C:\Program Files\Common Files\Oracle\Java\javapath;%SystemRoot%\system32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SYSTEMROOT%\System32\WindowsPowerShell\v1.0\;%SYSTEMROOT%\System32\OpenSSH\;C:\Program Files\Git\cmd;C:\Program Files\nodejs\;C:\laragon\bin\php\php-8.3.36-Win32-vs16-x64;C:\ProgramData\ComposerSetup\bin" /f

echo.
echo ================================================================
echo  [SUCCESS] System PATH updated to PHP 8.3.36!
echo  Laragon, CLI, and Apache will now use PHP 8.3.36 by default.
echo ================================================================
echo.
timeout /t 5
