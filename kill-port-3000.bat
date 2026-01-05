@echo off
REM Port 3000 Cleanup Script (Windows)
REM Finds and kills any process using port 3000

echo.
echo Checking port 3000...
echo.

REM Find process using port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do set PID=%%a

if "%PID%"=="" (
    echo [OK] Port 3000 is available ^(nothing using it^)
    exit /b 0
)

echo [WARNING] Port 3000 is in use by process: %PID%
echo.

REM Show what's running
echo Process details:
tasklist /FI "PID eq %PID%" /V
echo.

REM Ask to kill
set /p "KILL=Kill this process? (y/N): "
if /i not "%KILL%"=="y" (
    echo Process not killed. Port 3000 is still in use.
    exit /b 1
)

REM Kill the process
taskkill /PID %PID% /F

if %ERRORLEVEL% EQU 0 (
    echo [OK] Port 3000 is now available
    echo.
    echo You can now run:
    echo   npm run ui
) else (
    echo [ERROR] Failed to kill process
    exit /b 1
)
