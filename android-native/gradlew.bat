@echo off
REM Gradle start up script for Windows
setlocal enableextensions
set SCRIPT_DIR=%~dp0
set CLASSPATH=%SCRIPT_DIR%gradle\wrapper\gradle-wrapper.jar
if not exist "%CLASSPATH%" (
  echo ERROR: Gradle wrapper jar not found at %CLASSPATH%. Please copy gradle-wrapper.jar into gradle\wrapper\.
  exit /b 1
)
java -jar "%CLASSPATH%" %*
