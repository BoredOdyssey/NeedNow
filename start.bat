@echo off
cd /d "%~dp0"

echo ============================================================
echo   NeedNow Marketplace - Starting...
echo ============================================================

start "NeedNow Backend" cmd /k "C:\NVM\nvm\v22.11.0\node.exe" server\server.js

timeout /t 2 /nobreak >nul

start "NeedNow Frontend" cmd /k "C:\NVM\nvm\v22.11.0\node.exe" node_modules\vite\bin\vite.js

echo.
echo Both servers are starting in separate windows.
echo Open your browser at: http://localhost:3000
echo.
pause
