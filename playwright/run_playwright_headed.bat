@echo off
setlocal

chcp 65001 > nul
set "PYTHONUTF8=1"
set "NODE_OPTIONS=--enable-source-maps"

cd /d "%~dp0"

powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_playwright_headed.ps1"

set "EXIT_CODE=%ERRORLEVEL%"

echo.
pause
exit /b %EXIT_CODE%