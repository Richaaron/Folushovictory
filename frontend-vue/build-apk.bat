@echo off
echo ========================================
echo Building Folusho Victory Schools APK
echo ========================================
echo.

echo Step 1: Building web app...
call npm run build
if errorlevel 1 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)
echo Web build successful!
echo.

echo Step 2: Syncing Capacitor...
call npx cap sync
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo Capacitor sync successful!
echo.

echo Step 3: Building Android APK...
echo NOTE: To build a signed APK, you need to set up signing in Android Studio
echo       or configure build.gradle with your keystore!
echo.
call npx cap build android
if errorlevel 1 (
    echo ERROR: Android build failed!
    pause
    exit /b 1
)
echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo The APK should be in: android\app\build\outputs\apk\debug\
echo.
pause
