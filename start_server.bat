@echo off
title AI Internship Aggregator and Recommendation Platform Server
cls
echo ====================================================================
echo   AI Internship Aggregator and Recommendation Platform
echo   Running WITHOUT XAMPP, Apache, MySQL, or PHP!
echo ====================================================================
echo.
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
echo [*] Starting Node.js backend server on http://localhost:3000 ...
echo [*] Keep this command window OPEN while using the website.
echo [*] Press Ctrl+C in this window if you want to stop the server.
echo.
node server.js
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [-] Server encountered an error. Press any key to exit.
  pause
)
