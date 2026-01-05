@echo off
REM Polymarket Watcher - Automated Setup Script (Windows)
REM This script automates the fixes for the Start Scanning function

setlocal enabledelayedexpansion

echo.
echo Polymarket Watcher - Automated Setup
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo [OK] Found package.json
echo.

REM Step 1: Check Node.js
echo Step 1: Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

node --version
echo [OK] Node.js is installed
echo.

REM Step 2: Install dependencies
echo Step 2: Installing dependencies...
echo This may take a few minutes...
echo.

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Some dependencies failed to install
    echo Continuing anyway...
)
echo [OK] Dependencies installation complete
echo.

REM Step 3: Verify tsx
echo Step 3: Verifying tsx installation...
if exist "node_modules\.bin\tsx.cmd" (
    echo [OK] tsx is installed
) else if exist "node_modules\.bin\tsx" (
    echo [OK] tsx is installed
) else (
    echo [ERROR] tsx is not installed
    echo Attempting to install tsx...
    call npm install tsx
)
echo.

REM Step 4: Create .env file
echo Step 4: Setting up environment variables...
if exist ".env" (
    echo [WARNING] .env file already exists
    set /p "OVERWRITE=Do you want to overwrite it? (y/N): "
    if /i "!OVERWRITE!"=="y" (
        copy /y .env.example .env >nul
        echo [OK] .env file created from template
    ) else (
        echo Keeping existing .env file
    )
) else (
    copy .env.example .env >nul
    echo [OK] .env file created from template
)
echo.

REM Step 5: Discord webhook setup
echo Step 5: Configuring Discord webhook...
echo.
echo You need a Discord webhook URL to receive alerts.
echo To get one:
echo   1. Go to your Discord server settings
echo   2. Navigate to Integrations - Webhooks
echo   3. Click 'New Webhook'
echo   4. Copy the webhook URL
echo.
set /p "HASWEBHOOK=Do you have a Discord webhook URL? (y/N): "
if /i "!HASWEBHOOK!"=="y" (
    echo.
    set /p "WEBHOOK_URL=Enter your Discord webhook URL: "
    if not "!WEBHOOK_URL!"=="" (
        REM Update .env file (simple append method)
        findstr /v "^DISCORD_WEBHOOK_URL=" .env > .env.tmp
        echo DISCORD_WEBHOOK_URL=!WEBHOOK_URL!>> .env.tmp
        move /y .env.tmp .env >nul
        echo [OK] Discord webhook URL configured
    ) else (
        echo [WARNING] No webhook URL provided
        echo You'll need to edit .env manually
    )
) else (
    echo [WARNING] Skipped webhook configuration
    echo Don't forget to edit .env and add your webhook URL!
)
echo.

REM Step 6: Verify structure
echo Step 6: Verifying project structure...
set ERRORS=0

if not exist "src\index.ts" (
    echo [ERROR] src\index.ts not found
    set /a ERRORS+=1
) else (
    echo [OK] src\index.ts exists
)

if not exist "desktop-ui\watcher-manager.ts" (
    echo [ERROR] desktop-ui\watcher-manager.ts not found
    set /a ERRORS+=1
) else (
    echo [OK] desktop-ui\watcher-manager.ts exists
)

if not exist "desktop-ui\server.ts" (
    echo [ERROR] desktop-ui\server.ts not found
    set /a ERRORS+=1
) else (
    echo [OK] desktop-ui\server.ts exists
)

if not exist "desktop-ui\public\app.js" (
    echo [ERROR] desktop-ui\public\app.js not found
    set /a ERRORS+=1
) else (
    echo [OK] desktop-ui\public\app.js exists
)

if !ERRORS! GTR 0 (
    echo.
    echo [ERROR] Project structure verification failed
    echo Some files are missing. The application may not work correctly.
    pause
    exit /b 1
)
echo.

REM Step 7: Test webhook
echo Step 7: Testing configuration...
findstr /c:"DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/" .env >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set /p "TESTWEBHOOK=Test Discord webhook now? (y/N): "
    if /i "!TESTWEBHOOK!"=="y" (
        echo Sending test webhook...
        call npm run test:webhook
    )
) else (
    echo [WARNING] Cannot test webhook - not configured yet
)
echo.

REM Summary
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. If you haven't already, configure your Discord webhook:
echo    notepad .env
echo.
echo 2. Start the desktop UI:
echo    npm run ui
echo.
echo 3. In the UI:
echo    - Click 'Start Scanning' button
echo    - Switch to 'Scanning' tab to see live logs
echo    - Check 'Recent Trades' tab for matching trades
echo.
echo Alternative: Run in terminal (no UI):
echo    npm run dev
echo.
echo For troubleshooting, see: SETUP.md
echo.
echo Happy trading!
echo.

pause
