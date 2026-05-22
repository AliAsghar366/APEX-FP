@echo off
title ApexFX Local Site
echo.
echo  ============================================
echo   ApexFX Local Site  -  http://localhost:3000
echo  ============================================
echo.
echo  Open your browser to: http://localhost:3000
echo  Press Ctrl+C to stop the server.
echo.
cd /d "%~dp0"
python server.py
pause
