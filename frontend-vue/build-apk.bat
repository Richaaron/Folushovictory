@echo off
REM Build APK with proper Java and Android SDK environment setup

setlocal enabledelayedexpansion

REM Set Java home to Eclipse Adoptium JDK
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot"

REM Validate JAVA_HOME
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ERROR: Java not found at %JAVA_HOME%
    echo Please ensure Eclipse Adoptium JDK is installed at that location
    exit /b 1
)

REM Update PATH to include Java
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Verify Java is accessible
echo Verifying Java setup...
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java verification failed
    exit /b 1
)

echo Java: OK
echo.

REM Run the build
echo Building web resources...
call npm run build:web
if errorlevel 1 (
    echo ERROR: Web build failed
    exit /b 1
)

echo.
echo Setting up Android project...
call npx cap add android
if errorlevel 1 (
    echo WARNING: cap add android failed (may already exist)
)

echo.
echo Building APK...
call npx cap build android -- ^
  --keystorepath=android/app/build-keystore.jks ^
  --keystorepass=yourpass ^
  --keystorealias=builditutor ^
  --keystorealiaspass=yourpass

if errorlevel 1 (
    echo ERROR: APK build failed
    exit /b 1
)

echo.
echo ========================================
echo APK Build Successful!
echo ========================================
echo Your APK is ready at:
echo android\app\build\outputs\apk\release\app-release.apk
exit /b 0
