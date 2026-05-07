@echo off
setlocal

cd /d "%~dp0"
chcp 65001 > nul
set "PYTHONUTF8=1"

powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File ".\run_newman.ps1"

echo.
if errorlevel 1 (
    echo [FAIL] Newman 실행 중 오류가 발생했습니다.
) else (
    echo [OK] Newman 실행이 완료되었습니다.
)

pause
endlocal