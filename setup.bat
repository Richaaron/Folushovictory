@echo off
REM Setup script for Build IT multi-platform development on Windows
REM Run this after cloning the repository

echo.
echo ========================================
echo Build IT - Multi-Platform Setup
echo ========================================
echo.

REM Check for Node.js
echo Checking for Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Download from: https://nodejs.org/
    goto error
)
echo ✓ Node.js found: 
node --version

REM Check for npm
echo Checking for npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed!
    goto error
)
echo ✓ npm found:
npm --version

echo.
echo Installing frontend dependencies...
cd frontend-vue
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    goto error
)
echo ✓ Dependencies installed

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. For Windows EXE:
echo    cd frontend-vue
echo    npm run build:exe
echo.
echo 2. For Android APK (requires Android SDK):
echo    cd frontend-vue
echo    npm run cap:add
echo    npm run build:apk
echo.
echo 3. For development mode:
echo    cd frontend-vue
echo    npm run dev
echo.
echo See MULTI_PLATFORM_BUILD_GUIDE.md for detailed instructions
echo.

goto end

:error
echo.
echo ========================================
echo Setup Failed!
echo ========================================
echo.
exit /b 1

:end
cd ..
