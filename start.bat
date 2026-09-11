@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found on this computer.
    echo Please install it from https://nodejs.org/ ^(LTS version^) and run this again.
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed. See errors above.
        pause
        exit /b %errorlevel%
    )

    echo Rebuilding native modules for Electron...
    call npx electron-builder install-app-deps
    if errorlevel 1 (
        echo.
        echo Rebuilding native modules failed. See errors above.
        pause
        exit /b %errorlevel%
    )
)

echo Starting app...
call npm start
if errorlevel 1 (
    echo.
    echo npm start failed. See errors above.
    pause
    exit /b %errorlevel%
)

pause
