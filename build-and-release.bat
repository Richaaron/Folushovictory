@echo off
REM GitHub Release Builder for Build IT
REM This script builds your APK and prepares it for GitHub release

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ========================================
echo Build IT - GitHub Release Builder
echo ========================================
echo.

REM Get version from user or use default
set /p VERSION="Enter version number (e.g., 1.0.0) [default: 1.0.0]: "
if "%VERSION%"=="" set VERSION=1.0.0

echo.
echo Building APK for version v%VERSION%...
echo.

REM Build the APK
cd frontend-vue
call npm run build:apk

if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build Successful!
echo ========================================
echo.
echo Your APK is ready at:
echo frontend-vue\android\app\build\outputs\apk\release\app-release.apk
echo.
echo Next steps for GitHub Release:
echo 1. Go to https://github.com/YOUR_USERNAME/build-it/releases
echo 2. Click "Create a new release"
echo 3. Tag version: v%VERSION%
echo 4. Release title: Build IT v%VERSION%
echo 5. Upload the APK file
echo 6. Add release notes
echo 7. Click "Publish release"
echo.
echo Download link will be:
echo https://github.com/YOUR_USERNAME/build-it/releases/download/v%VERSION%/app-release.apk
echo.

cd ..

echo Would you like to commit these changes to git? (Y/N)
set /p COMMIT_CHOICE=""

if /i "%COMMIT_CHOICE%"=="Y" (
    echo.
    echo Committing changes...
    git add .
    git commit -m "v%VERSION% - Build IT release"
    if errorlevel 1 (
        echo.
        echo Note: Commit may have failed (no changes?) or git not initialized
        echo.
    ) else (
        echo.
        echo Changes committed successfully
        echo.
        echo Push to GitHub? (Y/N)
        set /p PUSH_CHOICE=""
        
        if /i "%PUSH_CHOICE%"=="Y" (
            echo Pushing to GitHub...
            git push
            if errorlevel 1 (
                echo.
                echo Push failed. Make sure your remote is configured:
                echo git remote add origin https://github.com/YOUR_USERNAME/build-it.git
                echo.
            )
        )
    )
)

echo.
echo Build and preparation complete!
echo See GITHUB_RELEASES_GUIDE.md for detailed instructions.
echo.
pause
